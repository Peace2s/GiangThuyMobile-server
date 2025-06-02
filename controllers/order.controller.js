const db = require('../models');
const Order = db.orders;
const OrderItem = db.orderItems;
const Cart = db.carts;
const CartItem = db.cartItems;
const Product = db.products;
const User = db.users;
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const ProductVariant = db.productVariants;
const cron = require('node-cron');

exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, note } = req.body;
    const userId = req.user.id;

    const cart = await Cart.findOne({
      where: { userId, status: 'active' },
      include: [{
        model: CartItem,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name']
          },
          {
            model: ProductVariant,
            as: 'productVariant',
            attributes: ['id', 'price', 'discount_price', 'stock_quantity', 'color', 'storage']
          }
        ]
      }]
    });

    if (!cart) {
      return res.status(400).json({ message: 'Không tìm thấy giỏ hàng' });
    }

    if (!cart.CartItems || cart.CartItems.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    for (const item of cart.CartItems) {
      if (!item.productVariant) {
        return res.status(400).json({
          message: `Không tìm thấy biến thể sản phẩm với ID ${item.variantId}`
        });
      }

      if (item.quantity > item.productVariant.stock_quantity) {
        return res.status(400).json({
          message: `Sản phẩm ${item.product.name} chỉ còn ${item.productVariant.stock_quantity} sản phẩm trong kho`
        });
      }
    }

    const totalAmount = cart.CartItems.reduce((sum, item) => {
      const price = item.productVariant.discount_price || item.productVariant.price;
      return sum + (price * item.quantity);
    }, 0);

    const order = await Order.create({
      userId,
      totalAmount,
      shippingAddress,
      paymentMethod,
      note,
      status: 'pending',
      paymentStatus: 'pending'
    });

    const outOfStockProducts = [];
    for (const item of cart.CartItems) {
      const price = item.productVariant.discount_price || item.productVariant.price;
      const newStockQuantity = item.productVariant.stock_quantity - item.quantity;

      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: price,
        totalPrice: price * item.quantity
      });

      await ProductVariant.update(
        {
          stock_quantity: newStockQuantity,
          status: newStockQuantity <= 0 ? 'out_of_stock' : 'in_stock'
        },
        { where: { id: item.variantId } }
      );

      if (newStockQuantity <= 0) {
        outOfStockProducts.push({
          name: item.product.name,
          variant: `${item.productVariant.color} - ${item.productVariant.storage}`
        });
      }
    }

    // await CartItem.destroy({
    //   where: { cartId: cart.id }
    // });

    // await cart.update({ 
    //   status: 'checkout',
    //   totalAmount: 0
    // });

    // await Cart.create({
    //   userId,
    //   status: 'active',
    //   totalAmount: 0
    // });

    let message = 'Tạo đơn hàng thành công';
    if (outOfStockProducts.length > 0) {
      const productNames = outOfStockProducts.map(p => `${p.name} (${p.variant})`).join(', ');
      message += `. Lưu ý: Các sản phẩm sau đã hết hàng: ${productNames}`;
    }

    res.status(201).json({
      message,
      orderId: order.id,
      outOfStockProducts: outOfStockProducts.length > 0 ? outOfStockProducts : null
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      message: 'Lỗi server',
      error: error.message
    });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.findAll({
      where: { userId },
      include: [{
        model: OrderItem,
        include: [
          {
            model: Product,
            attributes: ['id', 'name', 'image']
          },
          {
            model: ProductVariant,
            attributes: ['id', 'color', 'storage']
          }
        ]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id; // Lấy từ middleware xác thực

    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [{
        model: OrderItem,
        include: [{
          model: Product,
          attributes: ['id', 'name', 'image']
        }]
      }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Error getting order details:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [{
        model: OrderItem,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name']
          },
          {
            model: ProductVariant,
            as: 'productVariant',
            attributes: ['id', 'stock_quantity']
          }
        ]
      }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể hủy đơn hàng đang chờ xử lý' });
    }

    for (const item of order.OrderItems) {
      if (item.productVariant) {
        await ProductVariant.update(
          {
            stock_quantity: item.productVariant.stock_quantity + item.quantity,
            status: 'in_stock'
          },
          { where: { id: item.variantId } }
        );
      }
    }

    await order.update({ status: 'cancelled' });

    res.json({ message: 'Hủy đơn hàng thành công' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      message: 'Lỗi server',
      error: error.message
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const whereCondition = {};
    if (status) {
      whereCondition.status = status;
    }
    if (search) {
      whereCondition[Op.or] = [
        { id: { [Op.like]: `%${search}%` } },
        { shippingAddress: { [Op.like]: `%${search}%` } }
      ];
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      whereCondition.createdAt = {
        [Op.between]: [start, end]
      };
    }

    console.log('Query parameters:', { page, limit, status, search, startDate, endDate });
    console.log('Where condition:', whereCondition);

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          attributes: ['id', 'full_name', 'email', 'phone']
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'image']
            },
            {
              model: ProductVariant,
              attributes: ['id', 'color', 'storage']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('Found orders:', orders.length);

    res.status(200).json({
      total: count,
      orders: orders.map(order => ({
        ...order.toJSON(),
        user: order.user ? {
          ...order.user.toJSON(),
          name: order.user.full_name
        } : null,
        OrderItems: order.OrderItems || []
      })),
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    res.status(500).json({
      message: 'Lỗi server',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    if (status === 'delivered') {
      await order.update({
        status: 'delivered',
        paymentStatus: 'paid'
      });
    } else if (order.status === 'delivered' && status !== 'delivered' && status !== 'cancelled' && order.paymentMethod === 'cod') {
      await order.update({
        status,
        paymentStatus: 'pending'
      });
    } else {
      await order.update({ status });
    }

    res.status(200).json({ message: 'Cập nhật trạng thái đơn hàng thành công' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.deleteUnpaidOrders = async () => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const orders = await Order.findAll({
      where: {
        paymentMethod: ['vnpay', 'qr_sepay'],
        paymentStatus: 'pending',
        status: 'pending',
        createdAt: {
          [Op.lt]: tenMinutesAgo
        }
      },
      include: [{
        model: OrderItem,
        include: [
          {
            model: ProductVariant,
            attributes: ['id', 'stock_quantity']
          }
        ]
      }]
    });

    for (const order of orders) {
      for (const item of order.OrderItems) {
        if (item.productVariant) {
          await ProductVariant.update(
            {
              stock_quantity: item.productVariant.stock_quantity + item.quantity,
              status: 'in_stock'
            },
            { where: { id: item.variantId } }
          );
        }
      }

      await OrderItem.destroy({
        where: { orderId: order.id }
      });

      await order.destroy();
    }

    console.log(`Đã xóa ${orders.length} đơn hàng chưa thanh toán sau 10 phút`);
  } catch (error) {
    console.error('Lỗi khi xóa đơn hàng chưa thanh toán:', error);
  }
};

cron.schedule('* * * * *', () => {
  exports.deleteUnpaidOrders();
});