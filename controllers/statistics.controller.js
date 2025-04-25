const db = require('../models');
const Order = db.orders;
const Product = db.products;
const User = db.users;
const { Op } = require('sequelize');

exports.getStatistics = async (req, res) => {
  try {
    const totalProducts = await Product.count();

    const totalOrders = await Order.count();

    const totalUsers = await User.count();

    const totalRevenue = await Order.sum('totalAmount', {
      where: { status: 'delivered' }
    });

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