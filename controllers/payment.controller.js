const vnpayService = require('../config/payment.config');
const db = require('../models');
const Order = db.orders;
const OrderItem = db.orderItems;
const Cart = db.carts;
const CartItem = db.cartItems;
const Product = db.products;
const ProductVariant = db.productVariants;
const { Op } = require('sequelize');

exports.createPaymentUrl = async (req, res) => {
  try {
    const { shippingAddress, note } = req.body;
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
      paymentMethod: 'vnpay',
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

    const paymentUrl = vnpayService.createPaymentUrl(
      order.id,
      order.totalAmount,
      `Thanh toán đơn hàng #${order.id}`
    );

    res.json({ 
      paymentUrl,
      message: outOfStockProducts.length > 0 
        ? `Lưu ý: Các sản phẩm sau đã hết hàng: ${outOfStockProducts.map(p => `${p.name} (${p.variant})`).join(', ')}`
        : 'Tạo đơn hàng thành công'
    });
  } catch (error) {
    console.error('Error creating payment URL:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.vnpayReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;
    const isValid = vnpayService.verifyPayment(vnp_Params);

    if (!isValid) {
      return res.redirect(`${process.env.CLIENT_URL}/checkout?status=failed&message=Chữ ký không hợp lệ`);
    }

    const orderId = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const responseMessage = vnp_Params['vnp_Message'];
    const transactionStatus = vnp_Params['vnp_TransactionStatus'];

    if (!orderId) {
      return res.redirect(`${process.env.CLIENT_URL}/checkout?status=failed&message=Không tìm thấy mã đơn hàng`);
    }

    const order = await Order.findOne({
      where: { id: orderId },
      include: [{
        model: OrderItem,
        as: 'OrderItems',
        include: [{
          model: ProductVariant,
          as: 'productVariant'
        }]
      }]
    });

    if (!order) {
      return res.redirect(`${process.env.CLIENT_URL}/checkout?status=failed&message=Không tìm thấy đơn hàng`);
    }

    if (responseCode === '00') {
      try {
        await order.update({
          status: 'processing',
          paymentStatus: 'paid'
        });
        return res.redirect(`${process.env.CLIENT_URL}/checkout?status=success&message=${responseMessage || 'Thanh toán thành công'}`);
      } catch (error) {
        console.error('Error updating order status:', error);
        return res.redirect(`${process.env.CLIENT_URL}/checkout?status=failed&message=Lỗi cập nhật trạng thái đơn hàng`);
      }
    } else {
      try {
        // Restore stock quantity for each product variant
        for (const orderItem of order.OrderItems) {
          if (orderItem.productVariant) {
            await ProductVariant.update(
              { 
                stock_quantity: orderItem.productVariant.stock_quantity + orderItem.quantity,
                status: 'in_stock'
              },
              { where: { id: orderItem.variantId } }
            );
          }
        }

        await order.destroy();

        let errorMessage = 'Thanh toán thất bại';
        if (responseCode === '24') {
          errorMessage = 'Giao dịch bị hủy';
        } else if (responseCode === '07') {
          errorMessage = 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).';
        } else if (responseCode === '09') {
          errorMessage = 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.';
        } else if (responseCode === '10') {
          errorMessage = 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần';
        } else if (responseCode === '11') {
          errorMessage = 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.';
        } else if (responseCode === '12') {
          errorMessage = 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.';
        } else if (responseCode === '13') {
          errorMessage = 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.';
        } else if (responseCode === '51') {
          errorMessage = 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.';
        } else if (responseCode === '65') {
          errorMessage = 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.';
        } else if (responseCode === '75') {
          errorMessage = 'Ngân hàng thanh toán đang bảo trì.';
        } else if (responseCode === '79') {
          errorMessage = 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch.';
        } else if (responseCode === '99') {
          errorMessage = 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)';
        }

        return res.redirect(`${process.env.CLIENT_URL}/checkout?status=failed&message=${errorMessage}`);
      } catch (error) {
        console.error('Error restoring stock or deleting order:', error);
        return res.redirect(`${process.env.CLIENT_URL}/checkout?status=failed&message=Lỗi hoàn trả số lượng tồn kho`);
      }
    }
  } catch (error) {
    console.error('Error processing VNPay return:', error);
    return res.redirect(`${process.env.CLIENT_URL}/checkout?status=failed&message=Lỗi xử lý thanh toán`);
  }
}; 