BA/leetcode_clone_be_cus/
├── temp/
│   └── scraper_data/      <-- Nơi chứa các file .json tạm thời và file log lỗi
├── tools/
│   └── scraper/
│       ├── extractor.js   <-- (Chỉ cào mạng -> Lưu JSON)
│       ├── transformer.js <-- (Đọc JSON -> Lọc -> Lưu DB -> Xóa/Giữ file)
│       └── manager.js     <-- (Menu điều khiển)



-> tách file tool -> có thể ứng dụng cho nút tự cào, có giới hạn (n) tự nhập
ý tưởng
ta sẽ dùng cái folder temp hiện tại sẽ lưu tạm file vô đó, ta sẽ sinh ra 1 file .json chứa tạm, mỗi lần gọi thành công 1 bài sẽ lưu tạm vào file đó, sau đó sẽ đọc và lọc file đó rồi đẩy vô database (nhiệm vụ của processor.js) sau mỗi lần được manager gọi như thế, sau 1 lần đẩy thành công vô database rồi sẽ xóa file đó đi, nếu lỗi thì sẽ để tạm file đó ở đấy và trong đó sẽ chứa đoạn code dở đó kèm theo ở dưới sẽ chứa file log lỗi, nếu vẫn còn file chưa đẩy vô thì sẽ lặp lại quá trình trên qua file .json khác;

cách chạy:

- Di chuyển vào thư mục mới: cd tools/scraper
- Chạy lệnh: node manager.js