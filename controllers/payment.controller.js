const vnpayService = require('../services/payment.service');
const Order = require('../models/order.model');
const { Op } = require('sequelize');

exports.createPaymentUrl = async (req, res) => {
  try {
    const orderData = req.body;
    const userId = req.user.id;

    // Tạo order tạm thời để lấy orderId
    const tempOrder = await Order.create({
      userId,
      totalAmount: orderData.totalAmount,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: 'vnpay',
      note: orderData.note,
      status: 'pending',
      paymentStatus: 'pending'
    });

    const paymentUrl = vnpayService.createPaymentUrl(
      tempOrder.id,
      tempOrder.totalAmount,
      `Thanh toán đơn hàng #${tempOrder.id}`
    );

    res.json({ paymentUrl });
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
      return res.status(400).json({ message: 'Chữ ký không hợp lệ' });
    }

    const orderId = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];

    const order = await Order.findOne({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    if (responseCode === '00') {
      await order.update({
        status: 'processing',
        paymentStatus: 'paid'
      });
      return res.redirect(`${process.env.CLIENT_URL}/orders/${orderId}?status=success`);
    } else {
      await order.destroy(); // Xóa đơn hàng nếu thanh toán thất bại
      return res.redirect(`${process.env.CLIENT_URL}/checkout?status=failed`);
    }
  } catch (error) {
    console.error('Error processing VNPay return:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}; 