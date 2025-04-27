const db = require("../models");
const User = db.users;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/email');
const { generateRandomPassword } = require('../utils/helpers');

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phone, address } = req.body;

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const user = await User.create({
      fullName,
      email,
      phone: phone || null,
      password: hashedPassword,
      address: address || null
    });

    res.status(201).json({
      message: 'Đăng ký thành công',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm user theo email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Kiểm tra mật khẩu
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Thiết lập cookie cho token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 
    });

    // Thiết lập cookie cho thông tin người dùng
    res.cookie('user', JSON.stringify({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role
    }), {
      httpOnly: false, // Cho phép client đọc thông tin user
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 5 * 60 * 1000 // 5 phút
    });

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Tìm user theo email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Email không tồn tại trong hệ thống' 
      });
    }

    // Tạo mật khẩu mới ngẫu nhiên
    const newPassword = generateRandomPassword(8);
    
    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Cập nhật mật khẩu mới cho user
    await user.update({ password: hashedPassword });

    // Gửi email chứa mật khẩu mới
    const emailData = {
      to: email,
      subject: 'Đặt lại mật khẩu',
      html: `
        <h2>Đặt lại mật khẩu</h2>
        <p>Xin chào ${user.name},</p>
        <p>Mật khẩu mới của bạn là: <strong>${newPassword}</strong></p>
        <p>Vui lòng đăng nhập và thay đổi mật khẩu ngay sau khi nhận được email này.</p>
        <p>Trân trọng,</p>
        <p>Đội ngũ hỗ trợ</p>
      `
    };

    await sendEmail(emailData);

    res.json({ 
      success: true, 
      message: 'Mật khẩu mới đã được gửi đến email của bạn' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Có lỗi xảy ra. Vui lòng thử lại sau' 
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone, address } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Người dùng không tồn tại' 
      });
    }

    await user.update({ fullName, phone, address });

    res.json({ 
      success: true, 
      message: 'Cập nhật thông tin thành công',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Có lỗi xảy ra. Vui lòng thử lại sau' 
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Người dùng không tồn tại' 
      });
    }

    // Kiểm tra mật khẩu cũ
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mật khẩu hiện tại không đúng' 
      });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({ 
      success: true, 
      message: 'Đổi mật khẩu thành công' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Có lỗi xảy ra. Vui lòng thử lại sau' 
    });
  }
}; 