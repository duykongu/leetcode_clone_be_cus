# 🚀 LEETCODE CLONE -Master Project Overview (README 2)

Chào mừng bạn đến với **LeetCode Clone**, một nền tảng luyện tập lập trình trực tuyến (Online Judge) hoàn chỉnh. Hệ thống cung cấp môi trường làm bài tập thuật toán trực quan, biên dịch và chạy mã nguồn của người dùng một cách an toàn trong môi trường sandbox Docker, tích hợp hệ thống thảo luận cộng đồng Reddit-style và bảng tin hệ thống.

Dự án này được chia làm 2 phần cốt lõi:
1. **Frontend (`leetcode_clone`)**: Xây dựng bằng Next.js (React 19), Tailwind CSS và Monaco Editor.
2. **Backend (`leetcode_clone_be_cus`)**: Xây dựng bằng Node.js (Express), Prisma ORM, cơ sở dữ liệu MySQL và Docker Sandbox.

---

## 🗺️ Bản đồ Cấu trúc Dự án (Workspace Layout)

Dự án được tổ chức dưới dạng Monorepo / Multi-folder workspace:

```
leetcode/
├── leetcode_clone/             # Mã nguồn Frontend (Next.js)
│   ├── app/                    # Next.js App Router (User pages & Admin dashboard)
│   ├── components/             # Các UI Components tái sử dụng (dashboard, workspace...)
│   └── public/                 # File tĩnh (icons, images)
│
├── leetcode_clone_be_cus/      # Mã nguồn Backend (Express.js + Docker Sandbox)
│   ├── prisma/                 # Schema cấu trúc Database (schema.prisma) & Migrations
│   ├── src/
│   │   ├── config/             # Cấu hình Database, Cấu hình trình chạy Docker ngôn ngữ
│   │   ├── controllers/        # Tiếp nhận HTTP request, phân tích dữ liệu đầu vào
│   │   ├── services/           # Xử lý Logic nghiệp vụ chính (Streak, Docker Runner, Scraper)
│   │   ├── repositories/       # Tầng duy nhất giao tiếp với Database qua Prisma
│   │   ├── routes/             # Khai báo các Endpoint API
│   │   ├── utils/              # Tiện ích bổ trợ (thao tác Docker, file, logs)
│   │   └── middleware/         # Bảo mật JWT, upload avatar, phân quyền Admin
│   ├── Dockerfile.cpp          # Môi trường chạy mã nguồn C++
│   ├── Dockerfile.java         # Môi trường chạy mã nguồn Java
│   ├── Dockerfile.ts           # Môi trường chạy mã nguồn TypeScript
│   └── server.js               # Điểm khởi chạy Server Backend
│
├── bao_cao_chuong_2.md         # Báo cáo Phân tích & Thiết kế hệ thống (Markdown)
├── bao_cao_chuong_2.docx       # Báo cáo Phân tích & Thiết kế hệ thống (Word)
└── README_2.md                 # Tệp tổng quan dự án này
```

---

## 🛠️ Stack Công nghệ Sử dụng

### Tầng Frontend
*   **Framework**: Next.js 15 (React 19)
*   **Styling**: Tailwind CSS
*   **Code Editor**: Monaco Editor (Trình soạn thảo mã nguồn giống VS Code)
*   **State Management & API Query**: Hooks React tùy biến kết hợp với Fetch API và Server-Sent Events (SSE) để nhận tiến độ cào đề bài real-time.

### Tầng Backend
*   **Runtime**: Node.js
*   **Web Framework**: ExpressJS (API RESTful)
*   **ORM**: Prisma Client v5.x
*   **Database**: MySQL
*   **Authentication**: JSON Web Token (JWT) & Refresh Token
*   **Sandbox Engine**: Docker Engine (Chạy code cô lập)

---

## 🌟 Các Tính năng Nổi bật & Cơ chế Lõi

### 1. Trình chấm bài Sandbox Docker an toàn (Execution Engine)
*   **Bảo mật tuyệt đối**: Mã nguồn của người dùng được gửi lên và thực thi bên trong một Docker Container riêng biệt được ngắt hoàn toàn kết nối mạng (`--network=none`) và giới hạn bộ nhớ tối đa **256MB RAM**, thời gian chạy tối đa **2 giây** để chống mã độc phá hoại, rò rỉ dữ liệu hoặc tấn công DoS.
*   **Tiêm mã nguồn tự động (Wrapper & Common Structures)**: Tự động bổ sung các lớp dữ liệu cơ bản của LeetCode như `ListNode` (Danh sách liên kết) và `TreeNode` (Cây nhị phân) trước khi biên dịch trên 5 ngôn ngữ hỗ trợ: C++, Java, Python, JavaScript, TypeScript.
*   **Smart Cleanup (Dọn dẹp thông minh)**: Để tránh phình to dữ liệu Database, hệ thống giới hạn tối đa **20 bài nộp** cho mỗi cặp User - Bài tập. Khi vượt quá, hệ thống tự động lọc và xóa vĩnh viễn các bài nộp bị Lỗi (màu đỏ) cũ nhất trước, bảo toàn các bài nộp Đúng (màu xanh).

### 2. Thuật toán tính Streak ngày nộp bài chuẩn xác
*   **Chống trôi ngày DB**: Lưu mốc ngày theo múi giờ Việt Nam (+7) và ép giờ lưu trên cơ sở dữ liệu về đúng **12:00:00 UTC (Trưa)** trước khi ghi vào cột `last_active` kiểu `Date` của MySQL. Điều này ngăn chặn việc lệch ngày do múi giờ Server Cloud rạng sáng.
*   **Nghiệp vụ thực tế**: Chỉ cộng chuỗi Streak khi người dùng bấm nút **Submit** (Nộp bài chính thức) và vượt qua testcase, không cộng khi chỉ bấm **Run Code** (Chạy thử).

### 3. Diễn đàn Thảo luận (Discuss Hub) & Bình luận Đa cấp
*   **Reddit-style forum**: Hỗ trợ đăng bài viết thảo luận theo thẻ nhãn (Tags) và lọc theo bài nổi bật/bài ghim.
*   **Khóa kép chống spam**: Bảng `user_discussion_interactions` sử dụng khóa chính kép gồm `[user_id, discussion_id]` giúp chặn đứng hành vi spam upvote/downvote hoặc lưu bài liên tục.
*   **Bình luận lồng nhau (Nested Comments)**: Cho phép trả lời các bình luận (Reply) theo mô hình phân cấp không giới hạn nhờ liên kết đệ quy `parentId` trỏ về chính bảng `comments`.

### 4. Công cụ cào đề bài từ LeetCode (Scraper Tool)
*   **Tiết kiệm công sức Admin**: Admin chỉ cần cung cấp slug bài viết (ví dụ: `three-sum`), hệ thống sẽ tự động gửi request cào toàn bộ thông tin: mô tả đề bài, ví dụ minh họa, ràng buộc biến, code template khởi chạy của 5 ngôn ngữ và các testcase chấm điểm.
*   **Server-Sent Events (SSE)**: Tiến độ cào dữ liệu được đẩy trực tiếp và liên tục về màn hình Admin thông qua luồng SSE `/api/admin/scraper/progress` giúp cập nhật giao diện thời gian thực mà không cần reload trang.

---

## ⚡ Hướng dẫn Thiết lập & Chạy thử Hệ thống

### 📋 Yêu cầu Cài đặt Trước (Prerequisites)
1. **Node.js** >= 18.x
2. **MySQL** >= 8.0 (Đã tạo sẵn một database trống tên là `leetcode_db`)
3. **Docker Desktop** (Đang chạy ổn định trên máy)

---

### 1. Cài đặt và cấu hình Tầng Backend (`leetcode_clone_be_cus`)

1. Mở terminal, di chuyển vào thư mục backend và cài đặt thư viện:
   ```bash
   cd leetcode_clone_be_cus
   npm install
   ```

2. Tạo file cấu hình môi trường `.env` từ file `.env.example` và thiết lập kết nối MySQL:
   ```env
   # Database URL kết nối MySQL
   DATABASE_URL="mysql://root:matkhaucuaban@localhost:3306/leetcode_db"
   
   PORT=5000
   HOST=localhost
   
   # Khóa bí mật JWT bảo mật
   JWT_SECRET="viet_mot_chuoi_bi_mat_ngau_nhien_o_day_32_ky_tu"
   JWT_REFRESH_SECRET="viet_mot_chuoi_refresh_bi_mat_ngau_nhien_o_day"
   JWT_ACCESS_EXPIRES_IN="15m"
   JWT_REFRESH_EXPIRES_IN="7d"
   ```

3. Đồng bộ cấu hình bảng cơ sở dữ liệu với Prisma Migration:
   ```bash
   npx prisma migrate dev --name init
   ```
   *(Lệnh này tự động tạo các bảng và thiết lập quan hệ trong database `leetcode_db` dựa vào file [schema.prisma](file:///Users/phanducduy/Desktop/leetcode/leetcode_clone_be_cus/prisma/schema.prisma))*

4. **Xây dựng Docker Images Sandbox (Bắt buộc để chấm code)**:
   Để tạo các môi trường chạy biệt lập, hãy build 3 Dockerfile tương ứng cho C++, Java và TypeScript:
   ```bash
   # Tải các base images gốc từ Docker Hub
   docker pull python:3.9-slim
   docker pull node:18-alpine
   
   # Build các custom image tích hợp thư viện chấm bài
   docker build -t gcc-leetcode -f Dockerfile.cpp .
   docker build -t java-leetcode -f Dockerfile.java .
   docker build -t ts-leetcode -f Dockerfile.ts .
   ```

5. Khởi chạy Server Backend ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   Backend sẽ hoạt động tại địa chỉ: `http://localhost:5000`

---

### 2. Cài đặt và cấu hình Tầng Frontend (`leetcode_clone`)

1. Mở một cửa sổ Terminal mới, di chuyển vào thư mục frontend và cài đặt thư viện:
   ```bash
   cd leetcode_clone
   npm install
   ```

2. Tạo tệp cấu hình môi trường `.env.local` tương ứng:
   ```env
   API_HOST=localhost
   API_PORT=5000
   API_BASE_URL=http://localhost:5000
   NEXT_PUBLIC_API_HOST=localhost
   NEXT_PUBLIC_API_PORT=5000
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
   ```

3. Khởi chạy Server phát triển Frontend:
   ```bash
   npm run dev
   ```
   Ứng dụng Frontend sẽ chạy tại địa chỉ: `http://localhost:3000`

---

## 🛠️ Lưu ý Hỗ trợ Kỹ thuật & Khắc phục Sự cố

### 1. Sửa lỗi ngốn bộ nhớ RAM (RAM Leak / Out of Memory) trên Windows
Nếu chạy ứng dụng Next.js trên hệ điều hành Windows mà gặp hiện tượng RAM bị nuốt sạch hoặc crash Terminal, nguyên nhân là do công cụ biên dịch Turbopack mặc định của Next.js gặp rò rỉ bộ nhớ.
*   **Giải pháp đã tích hợp**: Các câu lệnh chạy dự án đã được chuyển hướng sử dụng trình Webpack ổn định thay thế. 
*   **Lệnh khắc phục khẩn cấp** (Xóa sạch cache biên dịch cũ):
    *   *Windows PowerShell*:
        ```powershell
        Remove-Item -Path .next, node_modules/.cache -Recurse -Force -ErrorAction SilentlyContinue
        ```
    *   *macOS/Linux / Git Bash*:
        ```bash
        rm -rf .next node_modules/.cache
        ```

### 2. Cách xem trực quan dữ liệu Database (Prisma Studio)
Prisma cung cấp một giao diện quản lý dữ liệu trực quan cực kỳ mạnh mẽ. Tại thư mục `leetcode_clone_be_cus`, bạn chạy lệnh sau:
```bash
npx prisma studio
```
Trình duyệt sẽ mở một trang web tại địa chỉ `http://localhost:5555`, cho phép bạn xem, tìm kiếm, chỉnh sửa, thêm hoặc xóa trực tiếp các bản ghi trong MySQL mà không cần dùng MySQL Workbench hay DBeaver.
