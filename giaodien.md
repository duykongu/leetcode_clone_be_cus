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
 



===============
++++++++++++=++
---------------


🚀 BẢN TỔNG HỢP CẬP NHẬT HỆ THỐNG (CHANGELOG)
1. 🗄️ Tầng Database & Cơ sở hạ tầng (Backend)
Cập nhật Schema (schema.prisma):

Thêm 3 bảng mới: Announcement (Bảng tin), Discussion (Bài viết thảo luận), và Comment (Bình luận). Đã chạy lệnh npx prisma migrate dev thành công.

Cấu trúc Dữ liệu chung (Data Structures):

Vấn đề cũ: LeetCode cung cấp sẵn ListNode (Danh sách liên kết) và TreeNode (Cây nhị phân) nhưng môi trường Docker của ta bị thiếu, gây lỗi biên dịch (VD: Lỗi NameError: Optional ở bài Add Two Numbers).

Giải pháp: Bổ sung COMMON_STRUCTURES vào language.config.js để "tiêm" ngầm các Class/Struct cơ bản này vào cả 5 ngôn ngữ (Python, JS, TS, Java, C++) trước khi chạy code của user.

Xử lý Testcase thông minh (formatter.util.js):

Nâng cấp thuật toán formatTestcaseInput bóc tách dữ liệu đầu vào. Thay vì chỉ cắt bằng khoảng trắng, thuật toán giờ đây biết đếm dấu ngoặc [], {} để bỏ qua các dấu phẩy bên trong mảng/chuỗi, giúp parse testcase chuẩn xác 100%.

2. 🧠 Tầng Logic Nghiệp vụ & API (Backend)
Phân biệt rạch ròi "Chạy Test" (Run) và "Nộp Bài" (Submit):

Thêm cờ isSubmit vào API /api/execute/run. Tránh việc người dùng bấm "Chạy Code" mà hệ thống cũng lưu vào DB gây rác dữ liệu.

Thuật toán Smart Cleanup (Dọn rác thông minh):

Tại submission.repository.js: Tự động giới hạn tối đa 20 lần nộp cho mỗi bài tập. Nếu vượt quá, hệ thống sẽ ưu tiên xóa vĩnh viễn các bài nộp bị Lỗi (Màu đỏ) cũ nhất, giữ lại các bài Nộp đúng (Màu xanh).

Thuật toán tính Chuỗi ngày (Streak Days):

Loại bỏ việc tính Streak dựa vào hàm đăng nhập (Login) hay biến updated_at.

Viết thuật toán mới so sánh tuyệt đối theo mốc ngày YYYY-MM-DD (Múi giờ VN +7) với cột last_active. Chỉ khi user Thực sự nộp bài, hệ thống mới tính toán khoảng cách ngày để quyết định "Nối chuỗi" hay "Reset về 1".

Hoàn thiện API Quản lý & Diễn đàn:

Xây dựng trọn bộ 4 file chức năng (Repo, Service, Controller, Route) cho hệ thống Thảo luận (/api/discussions).

Fix lỗi 500 do thiếu export module trong repositories/index.js và container.js.

3. 🎨 Tầng Giao diện & Trải nghiệm (Frontend)
Đại tu kiến trúc Trang chủ (Dashboard):

Áp dụng Clean Architecture (Chia để trị). Tách page.tsx thành các khối độc lập: HeroBanner, AnnouncementList, TrendingDiscuss, và RightSidebar (chứa Streak, Pick One).

Xây dựng Không gian Thảo luận (Discuss Hub):

Tạo mới hoàn toàn trang /discuss với thiết kế hiện đại (lấy cảm hứng từ Reddit), có thanh Filter (Bộ lọc), hiển thị Avatar, lượt Upvote, số lượng Comment, và đánh dấu bài được Ghim.

Nâng cấp Trải nghiệm làm bài (Problem Workspace):

Nút Khôi phục (Reset): Đã nối dây điện cho nút onReset để user quay về code khởi tạo ban đầu.

Xem lại Lịch sử: User có thể click vào bất kỳ bài nộp nào trong lịch sử. Hệ thống sẽ tự động đổi ngôn ngữ, đổ code cũ vào Editor, và bật Bảng điều khiển (Console) lên hiển thị lại thông báo lỗi y như lúc mới nộp.

Real-time Streak: Ngọn lửa Chuỗi ngày ở các trang thống kê được cập nhật ngay lập tức sau khi bấm "Nộp bài" thành công nhờ hàm refreshUser().

4. 📦 Môi trường Docker
Bổ sung Image chạy TypeScript (ts-leetcode) bằng lệnh: docker build -t ts-leetcode -f Dockerfile.ts .