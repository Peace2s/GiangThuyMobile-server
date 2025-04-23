const db = require('../models');
const Order = db.orders;
const Product = db.products;
const User = db.users;
const { Op } = require('sequelize');

exports.getStatistics = async (req, res) => {
  try {
    // Lấy tổng số sản phẩm
    const totalProducts = await Product.count();

    // Lấy tổng số đơn hàng
    const totalOrders = await Order.count();

    // Lấy tổng số người dùng
    const totalUsers = await User.count();

    // Lấy tổng doanh thu từ các đơn hàng đã giao
    const totalRevenue = await Order.sum('totalAmount', {
      where: { status: 'delivered' }
    });

    // Lấy 5 đơn hàng gần nhất
    const recentOrders = await Order.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'full_name', 'email', 'phone']
        },
        {
          model: db.orderItems,
          include: [{
            model: Product,
            attributes: ['id', 'name', 'image']
          }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Lấy 5 sản phẩm bán chạy nhất
    const topProducts = await db.orderItems.findAll({
      attributes: [
        'productId',
        [db.sequelize.fn('SUM', db.sequelize.col('quantity')), 'sold'],
        [db.sequelize.fn('SUM', db.sequelize.col('totalPrice')), 'revenue']
      ],
      include: [{
        model: Product,
        attributes: ['id', 'name']
      }],
      group: ['productId'],
      order: [[db.sequelize.literal('sold'), 'DESC']],
      limit: 5
    });

    res.status(200).json({
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: totalRevenue || 0,
      recentOrders,
      topProducts: topProducts.map(item => ({
        id: item.product.id,
        name: item.product.name,
        sold: item.getDataValue('sold'),
        revenue: item.getDataValue('revenue')
      }))
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ 
      message: 'Lỗi server', 
      error: error.message 
    });
  }
}; 