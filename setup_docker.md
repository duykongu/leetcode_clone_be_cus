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