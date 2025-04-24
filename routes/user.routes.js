const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Tất cả các routes dưới đây đều yêu cầu xác thực và quyền admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Lấy danh sách người dùng
router.get('/', userController.getAllUsers);

// Lấy thông tin chi tiết người dùng
router.get('/:id', userController.getUserById);

// Cập nhật thông tin người dùng
router.put('/:id', userController.updateUser);

// Xóa người dùng
router.delete('/:id', userController.deleteUser);

module.exports = router; 