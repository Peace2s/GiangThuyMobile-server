const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const adminMiddleware = async (req, res, next) => {
  try {
    // Lấy token từ header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Không tìm thấy token' });
    }

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Tìm user và kiểm tra role
    const user = await User.findByPk(decoded.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    // Lưu thông tin user vào request
    req.user = user;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

module.exports = adminMiddleware; 