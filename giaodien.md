SƠ ĐỒ KIẾN TRÚC
config/: Cấu hình cơ sở (Database, Language Docker).
repositories/: Tầng truy xuất Database (Thủ kho - chỉ chọc vào DB).
services/: Tầng logic nghiệp vụ (Quản lý - kiểm tra quyền, tính toán logic).
controllers/: Tầng tiếp nhận (Lễ tân - nhận request, trả response).
routes/: Tầng định tuyến (Cửa ra vào - quy định URL nào gặp Lễ tân nào).
container.js: "Ổ điện" trung tâm - quản lý sự sống và kết nối các thành phần.



------------------

-> npx prisma migrate dev --name add_discuss_and_announce
chạy đoạn trên để thêm bảng mới: thông báo, vấn đề bàn luận, comment\

------------------

- Repository (discussion.repository.js):
 + Là tầng duy nhất được tương tác với Prisma
 + Trừu tượng hóa các câu lệnh SQL/Prisma, giúp Service không cần biết DB được lưu trữ thế nào.

- Service (discussion.service.js):
 Kiểm tra xem User có quyền đăng bài không? Dữ liệu có trống không? Nếu hợp lệ mới ra lệnh cho Repo làm việc

- Controller (discussion.controller.js):
 + Lễ tân tiếp đón request từ Frontend.
 + Lấy dữ liệu từ req.body hoặc req.params, gọi Service xử lý, rồi trả về res.json cho Client

- Route (discussion.routes.js):
 + Phân loại yêu cầu.
 + Định nghĩa URL (ví dụ: /api/discussions) và cài đặt Middleware (ví dụ: authMiddleware.authenticate) để bảo vệ dữ liệu

 dễ hiểu hơn:
 prisma/schema.prisma: "Bản thiết kế" Database đã cập nhật 3 bảng Announcement, Discussion, Comment.  
 
 src/repositories/discussion.repository.js: Xử lý logic truy vấn DB cho diễn đàn, bao gồm việc JOIN dữ liệu User để lấy avatar/username.  
 
 src/services/discussion.service.js: Nơi thực hiện "cấm đăng ẩn danh", kiểm tra tiêu đề/nội dung trống trước khi lưu.  
 
 src/controllers/discussion.controller.js: Điểm tiếp nhận request từ diễn đàn, phân trang (getPagination), và bắt lỗi.  
 
 src/routes/discussion.routes.js: Định nghĩa lộ trình /api/discussions và gắn khóa authMiddleware.  
 
