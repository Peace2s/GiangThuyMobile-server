const db = require('../models');
const Order = db.orders;
const Product = db.products;
const User = db.users;
const { Op } = require('sequelize');
const { sequelize } = db;

exports.getStatistics = async (req, res) => {
  try {
    const totalProducts = await Product.count();

    const totalOrders = await Order.count();

    const totalUsers = await User.count();

    const totalRevenue = await Order.sum('totalAmount', {
      where: {
        status: {
          [Op.ne]: 'cancelled'
        }
      }
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

exports.getMonthlyRevenue = async (req, res) => {
  try {
    const monthlyRevenue = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
      ],
      where: {
        status: {
          [Op.ne]: 'cancelled'
        }
      },
      group: ['month'],
      order: [['month', 'ASC']]
    });

    const formattedData = monthlyRevenue.map(item => ({
      month: item.getDataValue('month'),
      revenue: parseFloat(item.getDataValue('revenue')) || 0
    }));

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRevenueByDateRange = async (req, res) => {
  try {
    let { startDate, endDate, groupBy = 'day' } = req.query;
    
    if (!startDate || !endDate) {
      const currentYear = new Date().getFullYear();
      startDate = `${currentYear}-01-01`;
      endDate = `${currentYear}-12-31`;
      groupBy = 'month';
    }

    let dateFormat;
    let groupByFormat;
    
    switch(groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        groupByFormat = 'DATE(createdAt)';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        groupByFormat = 'DATE_FORMAT(createdAt, "%Y-%m")';
        break;
      case 'year':
        dateFormat = '%Y';
        groupByFormat = 'YEAR(createdAt)';
        break;
      default:
        dateFormat = '%Y-%m-%d';
        groupByFormat = 'DATE(createdAt)';
    }

    const revenueData = await Order.findAll({
      attributes: [
        [sequelize.literal(`DATE_FORMAT(createdAt, '${dateFormat}')`), 'date'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
      ],
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        },
        status: {
          [Op.ne]: 'cancelled'
        }
      },
      group: [sequelize.literal(`DATE_FORMAT(createdAt, '${dateFormat}')`)],
      order: [[sequelize.literal('date'), 'ASC']],
      raw: true
    });

    const totalRevenue = await Order.sum('totalAmount', {
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        },
        status: {
          [Op.ne]: 'cancelled'
        }
      }
    });

    const formattedData = revenueData.map(item => ({
      date: item.date,
      revenue: parseFloat(item.revenue) || 0
    }));

    res.json({
      data: formattedData,
      totalRevenue: totalRevenue || 0,
      startDate,
      endDate,
      groupBy
    });
  } catch (error) {
    console.error('Error getting revenue by date range:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}; 