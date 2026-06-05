const express = require('express');
const router = express.Router();
const { announcementController } = require('../container'); // Lấy ông Lễ tân từ Container
const authMiddleware = require('../middleware/auth.middleware'); // Lấy ông Bảo vệ kiểm tra thẻ

// 1. URL lấy thông báo (Ai cũng xem được, không cần đăng nhập)
// Địa chỉ: GET /api/announcements
// Chọc vô: Hàm getHomeAnnouncements của ông Lễ tân
router.get('/', announcementController.getHomeAnnouncements);

// 2. URL tạo thông báo (Bắt buộc phải đăng nhập)
// Địa chỉ: POST /api/announcements
// Chọc vô: Bảo vệ (authenticate) -> Lễ tân (createAnnouncement)
router.post('/', authMiddleware.authenticate, announcementController.createAnnouncement);
// 3. URL sửa thông báo (Bắt buộc đăng nhập & là Admin)
// Địa chỉ: PUT /api/announcements/:id
router.put('/:id', authMiddleware.authenticate, announcementController.updateAnnouncement);

// 4. URL xóa thông báo (Bắt buộc đăng nhập & là Admin)
// Địa chỉ: DELETE /api/announcements/:id
router.delete('/:id', authMiddleware.authenticate, announcementController.deleteAnnouncement);
module.exports = router;