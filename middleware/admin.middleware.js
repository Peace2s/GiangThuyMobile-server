const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findByPk(decoded.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập'
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
          code: 'TOKEN_EXPIRED'
        });
      }

      if (jwtError instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          message: 'Token không hợp lệ',
          code: 'INVALID_TOKEN'
        });
      }

      throw jwtError; // Nếu là lỗi khác thì throw để catch bên ngoài xử lý
    }
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = adminMiddleware; 