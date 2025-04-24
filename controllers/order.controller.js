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

// Tạo đơn hàng mới
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, note } = req.body;
    const userId = req.user.id;

    // Tìm giỏ hàng của người dùng
    const cart = await Cart.findOne({
      where: { userId, status: 'active' },
      include: [{
        model: CartItem,
        include: [{
          model: Product,
          attributes: ['id', 'name', 'stock_quantity']
        }]
      }]
    });

    if (!cart || !cart.CartItems.length) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    // Kiểm tra số lượng tồn kho
    for (const item of cart.CartItems) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        return res.status(400).json({ 
          message: `Không tìm thấy sản phẩm với ID ${item.productId}` 
        });
      }
      if (item.quantity > product.stock_quantity) {
        return res.status(400).json({ 
          message: `Sản phẩm ${product.name} chỉ còn ${product.stock_quantity} sản phẩm trong kho` 
        });
      }
    }

    // Tính tổng tiền
    const totalAmount = cart.CartItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );

    // Tạo đơn hàng mới
    const order = await Order.create({
      userId,
      totalAmount,
      shippingAddress,
      paymentMethod,
      note,
      status: 'pending',
      paymentStatus: 'pending'
    });

    // Tạo chi tiết đơn hàng và cập nhật số lượng tồn kho
    for (const item of req.body.items) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.price * item.quantity
      });

      // Cập nhật số lượng tồn kho
      const product = await Product.findByPk(item.productId);
      await product.update({
        stock_quantity: product.stock_quantity - item.quantity
      });
    }

    // Xóa các item trong giỏ hàng
    await CartItem.destroy({
      where: { cartId: cart.id }
    });

    // Cập nhật trạng thái và làm trống giỏ hàng
    await cart.update({ 
      status: 'checkout'
    });

    // Tạo giỏ hàng mới cho người dùng
    await Cart.create({
      userId,
      status: 'active',
      totalAmount: 0
    });

    res.status(201).json({ 
      message: 'Tạo đơn hàng thành công',
      orderId: order.id
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      message: 'Lỗi server', 
      error: error.message 
    });
  }
};

// Lấy danh sách đơn hàng của người dùng
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ middleware xác thực

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

// Lấy chi tiết đơn hàng
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

// Hủy đơn hàng
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id; // Lấy từ middleware xác thực

    const order = await Order.findOne({
      where: { id: orderId, userId, status: 'pending' },
      include: [{
        model: OrderItem,
        include: [
          {
            model: Product,
            attributes: ['id', 'name', 'stock_quantity']
          },
          {
            model: ProductVariant,
            attributes: ['id', 'stock_quantity']
          }
        ]
      }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc không thể hủy' });
    }

    // Hoàn lại số lượng tồn kho
    for (const item of order.OrderItems) {
      if (item.ProductVariant) {
        await ProductVariant.update(
          { stock_quantity: item.ProductVariant.stock_quantity + item.quantity },
          { where: { id: item.variantId } }
        );
      }
    }

    // Cập nhật trạng thái đơn hàng
    await order.update({ status: 'cancelled' });

    res.status(200).json({ message: 'Hủy đơn hàng thành công' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy tất cả đơn hàng (cho admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
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

    // Log để debug
    console.log('Query parameters:', { page, limit, status, search });
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

    // Log kết quả
    console.log('Found orders:', orders.length);

    res.status(200).json({
      total: count,
      orders: orders.map(order => ({
        ...order.toJSON(),
        user: order.user ? {
          ...order.user.toJSON(),
          name: order.user.full_name // Map full_name to name for frontend
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

// Cập nhật trạng thái đơn hàng (cho admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    await order.update({ status });
    res.status(200).json({ message: 'Cập nhật trạng thái đơn hàng thành công' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy thống kê đơn hàng (cho admin)
exports.getOrderStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereCondition = {};
    if (startDate && endDate) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const orders = await Order.findAll({
      where: whereCondition,
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status']
    });

    const totalOrders = await Order.count({ where: whereCondition });
    const totalRevenue = await Order.sum('totalAmount', { where: whereCondition });

    res.status(200).json({
      orders,
      totalOrders,
      totalRevenue
    });
  } catch (error) {
    console.error('Error getting order statistics:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}; 