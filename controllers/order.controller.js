const db = require('../models');
const Order = db.orders;
const OrderItem = db.orderItems;
const Cart = db.carts;
const CartItem = db.cartItems;
const Product = db.products;
const { Op } = require('sequelize');

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
    for (const item of cart.CartItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        selectedColor: item.selectedColor,
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
        include: [{
          model: Product,
          attributes: ['id', 'name', 'image']
        }]
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
        include: [{
          model: Product
        }]
      }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc không thể hủy' });
    }

    // Hoàn lại số lượng tồn kho
    for (const item of order.OrderItems) {
      await Product.update(
        { stock_quantity: item.Product.stock_quantity + item.quantity },
        { where: { id: item.productId } }
      );
    }

    // Cập nhật trạng thái đơn hàng
    await order.update({ status: 'cancelled' });

    res.status(200).json({ message: 'Hủy đơn hàng thành công' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}; 