const db = require('../models');
const Cart = db.carts;
const CartItem = db.cartItems;
const Product = db.products;
const { Op } = require('sequelize');

// Thêm sản phẩm vào giỏ hàng
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user?.id;

    // Tìm sản phẩm
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    if (userId) {
      // Nếu đã đăng nhập, lưu vào database
      let cart = await Cart.findOne({
        where: { userId, status: 'active' }
      });

      if (!cart) {
        cart = await Cart.create({
          userId,
          status: 'active',
          totalAmount: 0
        });
      }

      // Kiểm tra sản phẩm đã có trong giỏ chưa
      let cartItem = await CartItem.findOne({
        where: {
          cartId: cart.id,
          productId
        }
      });

      if (cartItem) {
        // Cập nhật số lượng nếu đã có
        const newQuantity = cartItem.quantity + quantity;
        if (newQuantity > product.stock_quantity) {
          return res.status(400).json({
            message: `Không thể thêm ${quantity} sản phẩm vào giỏ hàng. Số lượng tồn kho không đủ.`
          });
        }
        await cartItem.update({
          quantity: newQuantity,
          totalPrice: product.price * newQuantity
        });
      } else {
        // Thêm sản phẩm mới vào giỏ
        cartItem = await CartItem.create({
          cartId: cart.id,
          productId,
          quantity,
          price: product.price,
          totalPrice: product.price * quantity
        });
      }

      // Cập nhật tổng tiền giỏ hàng
      const cartItems = await CartItem.findAll({
        where: { cartId: cart.id }
      });
      const totalAmount = cartItems.reduce((sum, item) => {
        return sum + Number(item.totalPrice);
      }, 0);
      await cart.update({ totalAmount });

      return res.json({
        message: 'Thêm vào giỏ hàng thành công',
        cart: {
          ...cart.toJSON(),
          CartItems: cartItems
        }
      });
    }

    // Đối với khách vãng lai, trả về thông tin sản phẩm để lưu vào localStorage
    return res.json({
      message: 'Thêm vào giỏ hàng thành công',
      product: {
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        stock_quantity: product.stock_quantity,
        quantity,
        totalPrice: product.price * quantity
      }
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy thông tin giỏ hàng
exports.getCart = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      let cart = await Cart.findOne({
        where: { userId, status: 'active' },
        include: [{
          model: CartItem,
          include: [{
            model: Product,
            attributes: ['id', 'name', 'image', 'stock_quantity', 'price']
          }]
        }]
      });

      if (!cart) {
        cart = await Cart.create({
          userId,
          status: 'active',
          totalAmount: 0
        });
      }

      return res.json(cart);
    }

    // Nếu chưa đăng nhập, trả về giỏ hàng rỗng
    return res.json({
      status: 'active',
      totalAmount: 0,
      CartItems: []
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
exports.updateCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    // Tìm cart item và kiểm tra quyền sở hữu
    const cartItem = await CartItem.findOne({
      where: { id: cartItemId },
      include: [{
        model: Cart,
        where: { userId, status: 'active' }
      }]
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    // Tìm thông tin sản phẩm
    const product = await Product.findByPk(cartItem.productId);
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    // Kiểm tra số lượng tồn kho
    if (quantity > product.stock_quantity) {
      return res.status(400).json({ message: 'Số lượng sản phẩm trong kho không đủ' });
    }

    // Cập nhật số lượng và tổng tiền
    cartItem.quantity = quantity;
    cartItem.totalPrice = cartItem.price * quantity;
    await cartItem.save();

    // Cập nhật tổng tiền giỏ hàng
    const cart = await Cart.findByPk(cartItem.cartId);
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id }
    });
    
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + Number(item.totalPrice);
    }, 0);
    await cart.update({ totalAmount });

    res.status(200).json({ message: 'Cập nhật giỏ hàng thành công' });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
exports.removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const userId = req.user.id; // Lấy từ middleware xác thực

    // Tìm cart item và kiểm tra quyền sở hữu
    const cartItem = await CartItem.findOne({
      where: { id: cartItemId },
      include: [{
        model: Cart,
        where: { userId, status: 'active' }
      }]
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    const cartId = cartItem.cartId;
    await cartItem.destroy();

    // Cập nhật tổng tiền giỏ hàng
    const cart = await Cart.findByPk(cartId);
    const cartItems = await CartItem.findAll({
      where: { cartId }
    });
    
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + Number(item.totalPrice);
    }, 0);
    await cart.update({ totalAmount });

    res.status(200).json({ message: 'Xóa sản phẩm khỏi giỏ hàng thành công' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Xóa toàn bộ giỏ hàng
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ middleware xác thực

    const cart = await Cart.findOne({
      where: { userId, status: 'active' }
    });

    if (!cart) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
    }

    await CartItem.destroy({
      where: { cartId: cart.id }
    });

    await cart.update({ totalAmount: 0 });

    res.status(200).json({ message: 'Xóa giỏ hàng thành công' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.mergeCart = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.id;

    // Tìm hoặc tạo giỏ hàng cho user
    let cart = await Cart.findOne({
      where: { userId, status: 'active' }
    });

    if (!cart) {
      cart = await Cart.create({
        userId,
        status: 'active',
        totalAmount: 0
      });
    }

    // Merge từng sản phẩm từ localStorage
    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) continue;

      let cartItem = await CartItem.findOne({
        where: {
          cartId: cart.id,
          productId: item.productId
        }
      });

      if (cartItem) {
        // Cập nhật số lượng nếu đã có
        const newQuantity = Math.min(
          cartItem.quantity + item.quantity,
          product.stock_quantity
        );
        await cartItem.update({
          quantity: newQuantity,
          totalPrice: product.price * newQuantity
        });
      } else {
        // Thêm sản phẩm mới
        const quantity = Math.min(item.quantity, product.stock_quantity);
        await CartItem.create({
          cartId: cart.id,
          productId: item.productId,
          quantity,
          price: product.price,
          totalPrice: product.price * quantity
        });
      }
    }

    // Cập nhật tổng tiền
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'image', 'stock_quantity']
      }]
    });
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + Number(item.totalPrice);
    }, 0);
    await cart.update({ totalAmount });

    res.json({
      message: 'Đồng bộ giỏ hàng thành công',
      cart: {
        ...cart.toJSON(),
        CartItems: cartItems
      }
    });
  } catch (error) {
    console.error('Error merging cart:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}; 