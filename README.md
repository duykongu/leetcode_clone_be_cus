# LeetCode Backend API

Backend API cho hệ thống LeetCode - nền tảng luyện tập lập trình với bài tập, nộp code và bảng xếp hạng.

## Stack công nghệ

- **Runtime**: Node.js (CommonJS)
- **Framework**: Express.js 5.x
- **Database**: MySQL với Prisma ORM
- **Validation**: Joi (đã cài đặt, chưa sử dụng)
- **Authentication**: Cấu hình sẵn cho JWT (chưa triển khai)
- **Environment**: dotenv

## Cấu trúc dự án (Clean Architecture)

```
src/
├── config/           # Cấu hình (database, etc.)
│   └── database.js   # Prisma client instance
├── controllers/      # Xử lý request/response
│   └── userController.js
├── services/         # Business logic
│   └── userService.js
├── repositories/     # Data access layer
│   └── userRepository.js
└── routes/           # Route definitions
    └── userRoutes.js
prisma/
├── schema.prisma    # Database schema & relations
└── (prisma client generated)
```

## Bắt đầu nhanh

### 1. Yêu cầu hệ thống

- Node.js >= 18.x
- MySQL >= 8.0
- npm hoặc yarn

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

Sao chép file `.env.example` thành `.env` và cập nhật các biến:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/leetcode_db"  // Đổi thành url local của mình

# Server
PORT=5000
HOST=localhost

# JWT (optional - khi triển khai auth)
# JWT_SECRET=your_jwt_secret
```

### 4. Thiết lập database

```bash
# Tạo database MySQL với tên: leetcode_db

# Chạy Prisma migrate (tạo tables)
npx prisma migrate dev --name init

# Hoặc generate client nếu chỉ thay đổi schema
npx prisma generate
```

### 5. Khởi động server

**Development (với nodemon):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server chạy tại: `http://localhost:3000`

Health check: `GET /health`

## API Endpoints

### Users

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/users` | Danh sách users (có pagination, filter role) |
| GET | `/api/users/:id` | Chi tiết user theo ID |
| GET | `/api/users/summaries` | Danh sách users lightweight (leaderboard style) |
| GET | `/api/users/leaderboard` | Bảng xếp hạng theo số bài đã giải |

**Query params (pagination):**
- `page` (default: 1)
- `limit` (default: 10)
- `sortBy` (default: `createdAt` hoặc `solvedCount`)
- `sortOrder` (default: `desc`)
- `role` (optional: `user` / `admin`)

**Ví dụ:**
```
GET /api/users?page=1&limit=20&sortBy=solvedCount&sortOrder=desc
GET /api/users/summaries?role=user
GET /api/users/leaderboard?limit=10
```

## Database Schema (Prisma)

### Enums
- `Role`: `user`, `admin`
- `Difficulty`: `easy`, `medium`, `hard`
- `Language`: `cpp`, `java`, `python`, `javascript`, `typescript`, `go`, `rust`
- `SubmissionStatus`: `pending`, `running`, `accepted`, `wrong_answer`, `time_limit_exceeded`, `memory_limit_exceeded`, `runtime_error`, `compile_error`

### Models chính
- **User**: Thông tin người dùng (username, email, role, solvedCount, streakDays)
- **OAuthAccount**: Liên kết OAuth (Google, GitHub, ...)
- **Problem**: Bài toán (title, description, difficulty, acceptanceRate)
- **TestCase**: Test cases cho từng bài
- **CodeTemplate**: Starter code & solution cho từng ngôn ngữ
- **Submission**: Nộp bài (code, status, runtime, memory)
- **UserProblemStatus**: Tiến độ user với từng bài
- **Tag & ProblemTag**: Tags phân loại bài

Xem chi tiết schema tại: `prisma/schema.prisma`

## Development Notes

### Architecture pattern
- **Controller**: Nhận request, trả response, xử lý error
- **Service**: Business logic, xử lý query params, transformations
- **Repository**: Truy vấn database qua Prisma, trả raw data

### Error response format
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human readable message"
}
```

### Success response format
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... } // optional
}
```

### Các script có sẵn

```bash
npm run dev      # Development với nodemon
npm start        # Production
npm test         # Test (chưa triển khai)
npx prisma studio # Xem database qua UI
npx prisma migrate dev # Tạo migration mới
npx prisma format # Format schema
```

## TODO / Triển khai tiếp theo

- [ ] Authentication & Authorization (JWT)
- [ ] Validation input với Joi
- [ ] Problems API (CRUD, list, filter by difficulty/tag)
- [ ] Submissions API (submit code, run test cases)
- [ ] Code execution service (judge engine)
- [ ] Rate limiting
- [ ] Logging (Winston / Pino)
- [ ] Unit tests & integration tests
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Docker setup
- [ ] CI/CD pipeline

## Contributing

1. Fork repository
2. Tạo branch feature (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Mở Pull Request

## License

ISC





# Hướng dẫn Setup Môi trường Docker bằng 1 lệnh duy nhất

## 1. Tải tất cả các Docker Images

Chạy lệnh gộp dưới đây tùy thuộc vào Shell bạn đang mở:

### Cho PowerShell:
```powershell
docker pull gcc:latest; docker pull eclipse-temurin:17-jdk-alpine; docker pull python:3.9-slim; docker pull node:18-alpine
```

### Cho CMD (Command Prompt):
```cmd
docker pull gcc:latest && docker pull eclipse-temurin:17-jdk-alpine && docker pull python:3.9-slim && docker pull node:18-alpine
```

## 2. Cài đặt thêm thư viện ở Frontend
Di chuyển vào thư mục `leetcode_fe` và chạy:
```bash
npm install axios
```


===============
**HƯỚNG DẪN CẬP NHẬT DỮ LIỆU BÀI TẬP (CƠ CHẾ DYNAMIC METADATA)**

- **Nếu database rỗng hoặc muốn lấy bài mới:** Chỉ cần chạy lệnh `node "Script Tool.js"`.
- **Nếu đã có sẵn data nhưng bị thiếu cấu trúc chấm code (metadata):** Cũng chỉ cần chạy lại lệnh `node "Script Tool.js"`. Hệ thống sẽ tự động quét, ghi đè (upsert) và bổ sung chuẩn xác `metadata` từ LeetCode vào các bài tập cũ mà không làm mất code mẫu.

===============

cài thư viện cho typescript 
mở terminal chạy trong dự án
-> npm install -g typescript
sau đó chạy tiếp -> tsc -v
================
3.Custom Docker Images (C++ và Java)
Đây là bước quan trọng nhất. Máy mới cần phải có 2 file Dockerfile và thực thi lệnh đúc Image để nhúng thư viện JSON vào trong.

A.C++ (gcc-leetcode)

mở file đã tạo tên là Dockerfile.cpp tại thư mục gốc Backend

-> docker build -t gcc-leetcode -f Dockerfile.cpp .


B.Java (java-leetcode)

file tên là Dockerfile.java tại thư mục gốc Backend

 -> docker build -t java-leetcode -f Dockerfile.java .


 cài typescript:
 docker build -t ts-leetcode -f Dockerfile.ts .

4. Kiểm tra thành quả
Sau khi người mới chạy xong các lệnh trên, bảo họ gõ lệnh này để kiểm tra xem "đồ nghề" đã đủ chưa:

-> docker images