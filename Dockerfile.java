# Sử dụng image Java gốc của bạn
FROM eclipse-temurin:17-jdk-alpine

# Cài đặt wget (nếu Alpine chưa có) và tải file gson.jar về thư mục /opt/
RUN apk add --no-cache wget && \
    wget https://repo1.maven.org/maven2/com/google/code/gson/gson/2.10.1/gson-2.10.1.jar -O /opt/gson.jar

    # terminal -> docker build -t java-leetcode -f Dockerfile.java .
    