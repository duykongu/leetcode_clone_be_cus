# Sử dụng image gcc gốc của bạn
FROM gcc:latest

# Tải file json.hpp và lưu vào thư mục thư viện chuẩn của C++
RUN wget https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp -O /usr/include/json.hpp

# Terminal tại thư mục Backend và chạy lệnh này để đúc thành một Image mới (đặt tên là gcc-leetcode):
    # -> docker build -t gcc-leetcode -f Dockerfile.cpp .