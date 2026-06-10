# BÁO CÁO ĐỒ ÁN PHÁT TRIỂN HỆ THỐNG LUYỆN THUẬT TOÁN TRỰC TUYẾN (LEETCODE CLONE)

---

## MỤC LỤC
*   **CHƯƠNG 1. TÍNH CẦN THIẾT CỦA ĐỀ TÀI**
*   **CHƯƠNG 2. PHÂN TÍCH YÊU CẦU HỆ THỐNG**
*   **CHƯƠNG 3. PHÂN TÍCH HỆ THỐNG (UML DIAGRAMS)**
*   **CHƯƠNG 4. THIẾT KẾ KIẾN TRÚC & CƠ SỞ DỮ LIỆU**
*   **CHƯƠNG 5. THIẾT KẾ RESTFUL API & GIAO DIỆN HỆ THỐNG**
*   **CHƯƠNG 6. CÔNG NGHỆ SỬ DỤNG & LÝ DO LỰA CHỌN**
*   **CHƯƠNG 7. CÀI ĐẶT VÀ TRIỂN KHAI HỆ THỐNG**
*   **CHƯƠNG 8. KẾT QUẢ ĐẠT ĐƯỢC & GIAO DIỆN CHƯƠNG TRÌNH**
*   **CHƯƠNG 9. KỊCH BẢN KIỂM THỬ CHI TIẾT (TEST CASES)**
*   **CHƯƠNG 10. ĐÁNH GIÁ HIỆU NĂNG & BENCHMARK**
*   **CHƯƠNG 11. HẠN CHẾ VÀ HƯỚNG PHÁT TRIỂN**

---

## CHƯƠNG 1. TÍNH CẦN THIẾT CỦA ĐỀ TÀI

### 1.1 Vấn đề thực tế cần giải quyết
Trong thời đại phát triển mạnh mẽ của ngành công nghệ phần mềm, kỹ năng giải quyết thuật toán và tư duy tối ưu hóa mã nguồn đã trở thành yêu cầu tuyển dụng cốt lõi của các tập đoàn công nghệ lớn. Việc rèn luyện lập trình giải quyết bài toán thực tế giúp lập trình viên nâng cao hiệu quả tư duy và viết code gọn gàng, an toàn. Tuy nhiên, các hình thức đào tạo và đánh giá năng lực lập trình truyền thống trong nhà trường hoặc doanh nghiệp còn gặp nhiều bất cập:
*   Giảng viên/Người quản lý phải kiểm tra mã nguồn thủ công, tốn nhiều thời gian và dễ xảy ra sai sót cảm tính.
*   Khó đo lường chính xác hiệu năng thực thi của mã nguồn (thời gian chạy tính bằng mili giây, dung lượng bộ nhớ RAM tiêu hao).
*   Thiếu một môi trường thực hành trực tuyến trực quan để người học có thể viết code và nhận phản hồi lỗi lập tức.

### 1.2 Vì sao cần xây dựng hệ thống?
Xây dựng một hệ thống luyện thuật toán trực tuyến tự động chấm điểm (**Online Judge / LeetCode Clone**) là vô cùng cấp thiết nhằm:
1.  **Tự động hóa hoàn toàn quy trình chấm bài**: Người dùng viết mã nguồn, nhấn nộp bài và nhận ngay kết quả chấm điểm (Đúng/Sai/Quá thời gian/Lỗi biên dịch) trong vài giây.
2.  **Chuẩn hóa dữ liệu đánh giá**: Hệ thống tự động chạy qua hàng loạt bộ dữ liệu kiểm thử (Test cases) từ cơ bản đến nâng cao để đảm bảo tính đúng đắn toàn diện của thuật toán.
3.  **Tạo động lực học tập**: Tích hợp các cơ chế như chuỗi ngày làm bài liên tục (Streak), bảng xếp hạng (Leaderboard) để thúc đẩy tương tác và học tập tích cực.
4.  **Hỗ trợ đào tạo nội bộ**: Cung cấp công cụ cho phép giảng viên hoặc quản trị viên quản lý, biên soạn bài tập theo chương trình học hoặc nhu cầu tuyển dụng riêng của doanh nghiệp.

### 1.3 Hạn chế của hệ thống hiện tại (LeetCode gốc)
LeetCode là nền tảng luyện thuật toán phổ biến nhất thế giới hiện nay, tuy nhiên nó tồn tại một số hạn chế lớn đối với nhu cầu đào tạo nội bộ:
*   **Không thể tùy biến hoặc quản lý đề bài nội bộ**: LeetCode không cho phép các tổ chức tự đưa các bài tập đặc thù, đề thi nội bộ của đơn vị mình lên hệ thống.
*   **Chi phí sở hữu đắt đỏ**: Để mở khóa các bài tập nâng cao hoặc các công cụ phân tích giải thuật chuyên sâu, người học phải trả chi phí tài khoản Premium rất cao.
*   **Thiếu khả năng giám sát tiến độ lớp học**: Không hỗ trợ các tài khoản giảng viên để theo dõi chi tiết quá trình, lịch sử nộp bài và thống kê chi tiết của từng sinh viên trong lớp.
*   **Giao diện và ngôn ngữ khó tiếp cận**: LeetCode hoàn toàn sử dụng tiếng Anh và giao diện hướng tới cộng đồng quốc tế, gây khó khăn cho học viên mới bắt đầu hoặc giảng dạy lập trình căn bản bằng tiếng Việt.

---

## CHƯƠNG 2. PHÂN TÍCH YÊU CẦU HỆ THỐNG

Hệ thống LeetCode Clone được thiết kế để phân chia rõ ràng các quyền hạn của các nhóm người dùng khác nhau nhằm tối ưu hóa tính tiện dụng và bảo mật.

### 2.1 Yêu cầu chức năng (Functional Requirements)

#### 2.1.1 Khách vãng lai (Guest)
*   **Đăng ký tài khoản**: Đăng ký tài khoản mới bằng Email và Mật khẩu.
*   **Đăng nhập hệ thống**: Đăng nhập bằng tài khoản đã đăng ký hoặc đăng nhập thông qua tài khoản liên kết (OAuth: Google, GitHub).
*   **Xem danh sách bài tập**: Đọc mô tả bài tập, xem độ khó, tỷ lệ giải thành công.
*   **Chạy thử code**: Viết mã nguồn trên Monaco Editor và chạy thử (Run Code) với testcase mẫu (không lưu lịch sử nộp bài vào DB).
*   **Xem diễn đàn**: Đọc các bài đăng thảo luận và các bình luận của cộng đồng.

#### 2.1.2 Thành viên đã đăng ký (User)
*   **Nộp bài chính thức (Submit Code)**: Gửi mã nguồn lên hệ thống để chấm điểm qua toàn bộ testcase trong DB. Kết quả chấm bài được lưu trữ vĩnh viễn vào lịch sử.
*   **Tích lũy Streak**: Tự động cộng dồn chuỗi ngày làm bài liên tục khi nộp bài đúng (`Accepted`).
*   **Lịch sử nộp bài (Submission History)**: Xem lại danh sách 20 lần nộp bài gần nhất, bao gồm cả trạng thái chi tiết và mã nguồn đã viết tại thời điểm đó để chỉnh sửa.
*   **Quản lý diễn đàn (Discuss)**: Đăng bài thảo luận mới, viết bình luận, phản hồi bình luận đa cấp (Reddit-style). Thực hiện Upvote/Downvote các bài viết/bình luận hữu ích.
*   **Quản lý hồ sơ cá nhân (Profile)**: Thay đổi ảnh đại diện (Avatar), ngày sinh, xem biểu đồ thống kê trực quan tỉ lệ bài giải theo cấp độ (Dễ, Trung bình, Khó).
*   **Lưu bài tập yêu thích (Bookmarks)**: Đánh dấu các bài tập khó để thuận tiện cho việc ôn tập lại.

#### 2.1.3 Quản trị viên (Admin)
*   **Quản lý bài tập (Problem Management)**: Thêm mới, chỉnh sửa thông tin, ẩn/hiện hoặc xóa các bài tập, thiết lập testcase và starter code cho từng ngôn ngữ.
*   **Sử dụng công cụ cào dữ liệu tự động (LeetCode Scraper)**: Nhập slug bài tập từ LeetCode chính thức, hệ thống tự động tải về mô tả, ví dụ, ràng buộc, starter code và testcases của bài đó.
*   **Quản lý thông báo (Announcements)**: Tạo và ghim các thông báo quan trọng lên trang chủ Dashboard.
*   **Quản lý diễn đàn cấp cao**: Ghim các bài viết chia sẻ giải pháp hay lên đầu trang thảo luận hoặc xóa các bình luận vi phạm quy chuẩn.

### 2.2 Yêu cầu phi chức năng (Non-Functional Requirements)

#### 2.2.1 Bảo mật (Security)
*   **Xác thực nâng cao**: Áp dụng cơ chế **Refresh Token Rotation (RTR)** nhằm bảo vệ tài khoản người dùng, chống tấn công phát lại token (Replay attacks) và tự động thu hồi quyền truy cập khi logout.
*   **Môi trường thực thi cô lập (Sandbox)**: Toàn bộ mã nguồn của người dùng nộp lên bắt buộc phải thực thi trong Docker Container biệt lập. Container bị ngắt hoàn toàn kết nối mạng (`--network=none`), không được truy cập thư mục hệ thống của máy chủ vật lý.
*   **An toàn cơ sở dữ liệu**: Prisma ORM tự động tham số hóa mọi tham số đầu vào của câu lệnh SQL, giúp hệ thống miễn nhiễm hoàn toàn với tấn công **SQL Injection**.

#### 2.2.2 Hiệu năng (Performance)
*   **Tốc độ thực thi chấm bài**: Hệ thống Sandbox cần phản hồi nhanh. Thời gian chấm bài trên các ngôn ngữ thông dịch (Python, JS) dưới 1 giây và các ngôn ngữ biên dịch (C++, Java) dưới 2 giây (đã gồm thời gian build).
*   **Tải trang nhanh**: Tận dụng Next.js Server Components kết hợp cache dữ liệu để đảm bảo API lấy danh sách bài tập hoặc hiển thị Dashboard tải dưới 200ms đối với hàng ngàn bản ghi.
*   **Tối ưu bộ nhớ**: Cơ chế tự động dọn dẹp (Smart Cleanup) giới hạn lưu tối đa 20 bản ghi nộp bài cho mỗi bài tập của User, tự động xóa các bài nộp bị lỗi cũ nhất để giữ kích thước database ổn định.

#### 2.2.3 Khả năng mở rộng (Scalability)
*   Kiến trúc Backend tổ chức theo mô hình **Clean Architecture** tách biệt hoàn toàn giữa Tầng định tuyến (Routes), Tầng điều khiển (Controllers), Tầng nghiệp vụ (Services) và Tầng dữ liệu (Repositories). Cho phép dễ dàng bổ sung ngôn ngữ lập trình chấm điểm mới hoặc nâng cấp cơ sở dữ liệu mà không ảnh hưởng tới logic nghiệp vụ.

#### 2.2.4 Tính khả dụng (Usability)
*   Giao diện responsive tương thích tốt với mọi thiết bị di động, máy tính bảng và desktop.
*   Sử dụng trình soạn thảo mã nguồn **Monaco Editor** chuyên nghiệp tích hợp phím tắt, thụt đầu dòng tự động, tô sáng cú pháp để người học có trải nghiệm tương tự khi lập trình trên VS Code.
*   Hỗ trợ chế độ giao diện tối (Dark Mode) chuẩn, phối màu HSL hài hòa giúp hạn chế mỏi mắt cho lập trình viên.

---

## CHƯƠNG 3. PHÂN TÍCH HỆ THỐNG (UML DIAGRAMS)

### 3.1 Sơ đồ Use Case tổng thể

Sơ đồ Use Case tổng quan thể hiện sự tương tác của 3 tác nhân (Khách vãng lai, Thành viên và Quản trị viên) với hệ thống LeetCode Clone:

```mermaid
graph LR
    subgraph TacNhan [Tác nhân]
        Guest["Khách vãng lai"]
        User["Thành viên"]
        Admin["Quản trị viên"]
    end

    subgraph HeThong ["Hệ thống LeetCode Clone"]
        UC_Auth("Đăng ký / Đăng nhập / Đăng xuất")
        UC_ViewProblems("Xem danh sách & Chi tiết bài tập")
        UC_RunCode("Chạy thử code (Sandbox)")
        UC_SubmitCode("Nộp bài chấm điểm & Lưu lịch sử")
        UC_Streak("Tích lũy Streak ngày nộp bài")
        UC_ViewForum("Xem & Tìm kiếm bài thảo luận")
        UC_InteractForum("Đăng bài, Bình luận, Upvote/Downvote")
        UC_ManageProblems("Thêm, Sửa, Xóa bài tập")
        UC_ScrapeProblems("Cào dữ liệu bài tập (LeetCode Scraper)")
        UC_ManageAnnounce("Quản lý thông báo bảng tin")
        UC_PinForum("Ghim bài viết & Bình luận lên đầu")
    end

    Guest --> UC_Auth
    Guest --> UC_ViewProblems
    Guest --> UC_RunCode
    Guest --> UC_ViewForum

    User --> UC_Auth
    User --> UC_ViewProblems
    User --> UC_RunCode
    User --> UC_SubmitCode
    User --> UC_Streak
    User --> UC_ViewForum
    User --> UC_InteractForum

    Admin --> UC_Auth
    Admin --> UC_ManageProblems
    Admin --> UC_ScrapeProblems
    Admin --> UC_ManageAnnounce
    Admin --> UC_PinForum
    Admin --> UC_ViewProblems
    Admin --> UC_ViewForum
```

---

### 3.2 Sơ đồ hoạt động (Activity Diagram)

#### 3.2.1 Hoạt động nộp bài và chấm code (Docker Sandbox Flow)
Mô tả quy trình chi tiết khi người dùng nhấn nút **Submit** hoặc **Run Code**:

```mermaid
stateDiagram-v2
    [*] --> SubmitPressed : Người dùng nhấn RUN hoặc SUBMIT
    SubmitPressed --> ValidateInput : Gửi code + ngôn ngữ + problemId lên Backend
    ValidateInput --> CheckDB : Lấy Testcases & Metadata của bài từ DB
    
    state check_env <<choice>>
    CheckDB --> check_env
    
    check_env --> PrepareWorkspace : Testcases hợp lệ
    check_env --> ErrorExit : Dữ liệu bài tập lỗi
    
    PrepareWorkspace --> InjectWrapper : Tiêm cấu trúc dữ liệu chung (ListNode, TreeNode) & mã xử lý I/O
    InjectWrapper --> CreateTempFiles : Ghi code vào thư mục tạm (temp/runId)
    CreateTempFiles --> SpawnDocker : Khởi chạy Docker Container Sandbox
    
    state is_compiled_lang <<choice>>
    SpawnDocker --> is_compiled_lang : Kiểm tra ngôn ngữ
    
    is_compiled_lang --> CompileCode : C++, Java, TypeScript (Biên dịch)
    is_compiled_lang --> RunDirect : Python, JavaScript (Thông dịch)
    
    state compile_status <<choice>>
    CompileCode --> compile_status
    compile_status --> RunDirect : Biên dịch thành công
    compile_status --> ReturnCompileError : Biên dịch thất bại (g++ / javac báo lỗi)
    
    ReturnCompileError --> CleanupFiles
    
    RunDirect --> RunTestcases : Đưa stdin vào container, giới hạn 256MB RAM & 2s chạy
    
    state testcase_evaluation <<choice>>
    RunTestcases --> testcase_evaluation : So sánh stdout với expectedOutput trong DB
    
    testcase_evaluation --> WrongAnswer : Trả về WRONG_ANSWER (Kết quả lệch)
    testcase_evaluation --> TLE : Trả về TIME_LIMIT_EXCEEDED (Chạy quá 2 giây)
    testcase_evaluation --> MLE : Trả về MEMORY_LIMIT_EXCEEDED (RAM vượt quá 256MB)
    testcase_evaluation --> Accepted : Trả về ACCEPTED (Đúng toàn bộ testcase)
    
    state check_submit <<choice>>
    Accepted --> check_submit
    WrongAnswer --> check_submit
    TLE --> check_submit
    MLE --> check_submit
    
    check_submit --> SaveToDB : isSubmit = true (Ghi lịch sử nộp bài)
    check_submit --> RespondClient : isSubmit = false (Chạy thử)
    
    state db_process {
        SaveToDB --> WriteSubmission : Ghi vào bảng submissions
        WriteSubmission --> UpdateStreak : Tính toán cộng Streak (múi giờ VN)
        UpdateStreak --> SmartCleanup : Dọn dẹp bản ghi thừa (giữ tối đa 20 bản ghi)
        SmartCleanup --> UpdateSolvedCount : Tăng solvedCount của User (nếu giải đúng lần đầu)
    }
    
    UpdateSolvedCount --> RespondClient
    RespondClient --> CleanupFiles : Dọn dẹp: Xóa container Docker & xóa thư mục temp/runId
    CleanupFiles --> [*]
    ErrorExit --> [*]
```

#### 3.2.2 Hoạt động tự động cào bài tập (Scraper Tool Flow)
Mô tả quy trình cào đề bài từ LeetCode chính thức của Admin:

```mermaid
stateDiagram-v2
    [*] --> RequestScrape : Admin nhập slug (ví dụ 'two-sum') & gửi yêu cầu
    RequestScrape --> InitSSE : Thiết lập kết nối Server-Sent Events (SSE)
    InitSSE --> SendStartProgress : Gửi trạng thái "Đang kết nối..." qua SSE
    
    SendStartProgress --> FetchLeetCodeAPI : Gửi GraphQL request tới API LeetCode chính thức
    
    state check_api <<choice>>
    FetchLeetCodeAPI --> check_api
    check_api --> ParseJSON : Nhận dữ liệu JSON thành công
    check_api --> SendErrorSSE : Lỗi kết nối / Đề bài không tồn tại
    
    ParseJSON --> ExtractDetails : Trích xuất tiêu đề, mô tả (Markdown), độ khó, ví dụ, ràng buộc
    ExtractDetails --> CleanHTML : Dọn dẹp định dạng HTML độc hại
    ExtractDetails --> GenerateTemplates : Sinh starter code cho 5 ngôn ngữ (C++, Java, Python, JS, TS)
    GenerateTemplates --> ParseTestcases : Trích xuất các ví dụ làm testcases chấm bài
    
    ParseTestcases --> SaveDatabase : Lưu thông tin vào các bảng DB (problems, test_cases, code_templates)
    
    state db_save_status <<choice>>
    SaveDatabase --> db_save_status
    db_save_status --> SendSuccessSSE : Lưu DB thành công
    db_save_status --> SendErrorSSE : Lỗi ghi DB (Trùng lặp slug...)
    
    SendSuccessSSE --> CloseConnection : SSE đẩy "Hoàn thành 100%" & đóng kết nối
    SendErrorSSE --> CloseConnection : SSE đẩy lỗi & đóng kết nối
    CloseConnection --> [*]
```

---

### 3.3 Sơ đồ tuần tự (Sequence Diagram)

#### 3.3.1 Quy trình nộp bài chấm điểm (Submit Code & Judge)
Sơ đồ mô tả sự tương tác giữa các tầng của hệ thống khi thực hiện chấm code:

```mermaid
sequenceDiagram
    autonumber
    actor User as Thành viên (FE)
    participant API as Express Server (BE)
    participant Repo as Submission Repository
    participant DB as MySQL Database
    participant Docker as Docker Sandbox Engine

    User->>API: POST /api/execute/run (problemId, language, code, isSubmit: true)
    activate API
    API->>Repo: queryProblemWithTestCases(problemId)
    activate Repo
    Repo->>DB: SELECT * FROM problems JOIN test_cases WHERE id = problemId
    activate DB
    DB-->>Repo: Trả về thông tin bài tập & danh sách testcases
    deactivate DB
    Repo-->>API: Trả về Object Problem chứa TestCases
    deactivate Repo

    API->>API: Tiêm cấu trúc bổ trợ & ghi mã nguồn vào temp/runId/solution
    
    API->>Docker: Khởi chạy Container (gcc/java/python...) & mount thư mục temp/runId
    activate Docker
    Note over API, Docker: Chạy biệt lập: ngắt mạng, giới hạn 256MB RAM
    Docker->>Docker: Biên dịch code (nếu là C++/Java) và thực thi tuần tự testcases
    Docker-->>API: Trả về kết quả thực thi (stdout, runtime_ms, memory_kb)
    deactivate Docker

    API->>API: So sánh kết quả thực thi với expectedOutput của từng testcase
    
    alt isSubmit == true
        API->>Repo: createSubmission({userId, problemId, code, status, runtime, memory})
        activate Repo
        Repo->>DB: INSERT INTO submissions, UPDATE streak_days, UPDATE solved_count
        activate DB
        DB-->>Repo: Xác nhận lưu trữ thành công
        deactivate DB
        Repo-->>API: Trả về bản ghi Submission đã lưu
        deactivate Repo
        
        API->>Repo: triggerSmartCleanup(userId, problemId)
        activate Repo
        Repo->>DB: DELETE FROM submissions WHERE status != 'accepted' (giới hạn 20 bản ghi)
        deactivate Repo
    end

    API->>API: Dọn dẹp thư mục tạm temp/runId trên ổ cứng server
    API-->>User: Trả về kết quả chấm điểm JSON (status, passedCases, totalCases, testCaseResults)
    deactivate API
```

#### 3.3.2 Cơ chế xoay vòng Refresh Token (Refresh Token Rotation - RTR)
Mô tả quy trình bảo vệ phiên đăng nhập an toàn, tự động làm mới Access Token và phát hiện mã độc phát lại:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Trình duyệt (FE)
    participant BE as Express Server (BE)
    participant DB as MySQL Database

    Note over Client, BE: 1. Sử dụng Access Token đã hết hạn gọi API được bảo vệ
    Client->>BE: GET /api/profile (Headers: Authorization Bearer AccessToken)
    activate BE
    BE->>BE: jwt.verify(AccessToken) -> Báo lỗi hết hạn (Expired Error)
    BE-->>Client: Trả về HTTP 401 Unauthorized (AccessToken Expired)
    deactivate BE

    Note over Client, BE: 2. Tự động gửi Refresh Token để xin cấp lại cặp Token mới
    Client->>BE: POST /api/refresh-token (Body: refreshToken)
    activate BE
    BE->>BE: SHA-256 Hash Refresh Token gửi lên
    BE->>DB: Tìm kiếm bản ghi trong bảng refresh_tokens bằng token_hash
    activate DB
    DB-->>BE: Trả về thông tin (revoked, expiresAt, userId)
    deactivate DB
    
    alt Trường hợp 1: Token đã bị hủy (revoked = true) -> Phát hiện có gian lận/đánh cắp!
        BE->>DB: Xóa/Hủy toàn bộ Refresh Tokens của User này (Bắt đăng nhập lại)
        BE-->>Client: Trả về HTTP 403 Forbidden (Vui lòng đăng nhập lại)
    else Trường hợp 2: Token hợp lệ & Chưa hết hạn
        BE->>DB: Chuyển trạng thái token cũ: revoked = true (Vô hiệu hóa vĩnh viễn)
        BE->>BE: Ký Access Token mới (15m) + Ký Refresh Token mới (7d)
        BE->>BE: SHA-256 Hash Refresh Token mới
        BE->>DB: INSERT INTO refresh_tokens (token_hash, userId, revoked: false)
        BE-->>Client: Trả về Access Token mới + Refresh Token mới (Xoay vòng thành công)
    end
    deactivate BE
```

---

### 3.4 Sơ đồ lớp (Class Diagram)

Sơ đồ lớp mô tả cấu trúc thiết kế Clean Architecture của module Quản lý bài tập (Problem) và module Chấm điểm thực thi (Execution/Submission) ở Backend:

```mermaid
classDiagram
    class BaseRepository {
        <<Repository>>
        +prismaClient prisma
        +findMany(args)
        +findUnique(args)
        +create(data)
        +update(id, data)
        +delete(id)
    }

    class ProblemsRepository {
        <<Repository>>
        +getProblemsList(page, limit, difficulty, search)
        +getProblemWithDetails(idOrSlug)
        +createProblem(data)
        +updateProblem(id, data)
    }
    BaseRepository <|-- ProblemsRepository

    class SubmissionRepository {
        <<Repository>>
        +saveSubmission(data)
        +getUserSubmissions(userId, problemId, limit)
        +countSolvedProblems(userId)
        +updateUserStreak(userId, transaction)
        +deleteOldFailedSubmissions(userId, problemId)
    }
    BaseRepository <|-- SubmissionRepository

    class ProblemService {
        <<Service>>
        -ProblemsRepository problemRepo
        +listProblems(filters)
        +getProblem(idOrSlug)
        +createManualProblem(data)
    }
    ProblemsRepository <-- ProblemService

    class ExecutionService {
        <<Service>>
        -ProblemsRepository problemRepo
        -SubmissionRepository submissionRepo
        +runOrSubmitCode(userId, problemId, language, code, isSubmit)
        -prepareDockerEnvironment(runId, language, code)
        -executeInContainer(runId, language)
        -evaluateOutputs(results, expectedOutputs)
    }
    ProblemsRepository <-- ExecutionService
    SubmissionRepository <-- ExecutionService

    class ProblemsController {
        <<Controller>>
        -ProblemService problemService
        +getProblems(req, res)
        +getProblemDetail(req, res)
        +createProblem(req, res)
    }
    ProblemService <-- ProblemsController

    class ExecutionController {
        <<Controller>>
        -ExecutionService executionService
        +executeCode(req, res)
    }
    ExecutionService <-- ExecutionController
```

---

## CHƯƠNG 4. THIẾT KẾ KIẾN TRÚC & CƠ SỞ DỮ LIỆU

### 4.1 Kiến trúc tổng thể hệ thống

Hệ thống được thiết kế theo mô hình kiến trúc Client - Server hiện đại, phân chia rõ ràng các vai trò và công nghệ như sau:

```mermaid
graph TD
    subgraph Client [Tầng Giao diện - Frontend]
        FE[Next.js Application] -->|HTTP/REST API| BE
        FE -->|SSE - Server-Sent Events| BE
    end

    subgraph Server [Tầng Xử lý - Backend]
        BE[ExpressJS Server] -->|Prisma ORM| DB[(MySQL Database)]
        BE -->|Docker API / CLI| Runner[Docker Sandbox Engine]
    end

    subgraph Sandbox [Tầng Thực thi Cô lập]
        Runner -->|Tạo Container| Py[Python Container]
        Runner -->|Tạo Container| JS[Node.js Container]
        Runner -->|Tạo Container| CPP[GCC/C++ Container]
        Runner -->|Tạo Container| Java[Java Container]
    end
```

*   **Tầng Giao diện (Frontend - Next.js)**: Chịu trách nhiệm render giao diện ứng dụng từ phía Server để tối ưu SEO (Server-Side Rendering), tương tác với các API của Backend thông qua Axios/Fetch API, quản lý trạng thái soạn thảo mã nguồn Monaco Editor, nhận dữ liệu tiến độ cào bài tập real-time qua kết nối Server-Sent Events (SSE).
*   **Tầng Web API (Backend - ExpressJS)**: Tiếp nhận các yêu cầu RESTful từ Frontend, kiểm tra phân quyền (JWT), xử lý các nghiệp vụ logic chính, tương tác với cơ sở dữ liệu qua Prisma ORM.
*   **Tầng Thực thi Cô lập (Docker Sandbox Engine)**: Mỗi khi có yêu cầu biên dịch hoặc chạy code, Backend gọi lệnh tới Docker Engine thông qua CLI/API để khởi động các container tương ứng (ví dụ: container chạy Python, container chạy Java, container chạy C++). Các container này nhận file code tạm thời của người học, biên dịch và chạy các testcases trong một môi trường cô lập tài nguyên phần cứng nghiêm ngặt trước khi trả kết quả stdout về Backend.
*   **Tầng Dữ liệu (Database - MySQL)**: Lưu giữ thông tin người dùng, đề bài, testcase, templates, lịch sử nộp bài và các hoạt động thảo luận.

---

### 4.2 Thiết kế cơ sở dữ liệu quan hệ (MySQL ERD)

Dưới đây là sơ đồ thực thể liên kết (ERD) thể hiện thiết kế cơ sở dữ liệu MySQL của hệ thống LeetCode Clone sử dụng Prisma ORM:

```mermaid
erDiagram
    User ||--o{ OAuthAccount : "has"
    User ||--o{ Submission : "submits"
    User ||--o{ UserProblemStatus : "tracks"
    User ||--o{ RefreshToken : "has"
    User ||--o{ Announcement : "creates"
    User ||--o{ Discussion : "posts"
    User ||--o{ Comment : "writes"
    User ||--o{ UserDiscussionInteraction : "interacts"
    User ||--o{ UserCommentInteraction : "interacts"
    User ||--o{ UserSavedProblem : "bookmarks"

    Problem ||--o{ TestCase : "has"
    Problem ||--o{ CodeTemplate : "defines"
    Problem ||--o{ Submission : "receives"
    Problem ||--o{ ProblemTag : "categorized_by"
    Problem ||--o{ UserProblemStatus : "tracked_in"
    Problem ||--o{ ProblemExample : "shows"
    Problem ||--o{ ProblemConstraint : "has"
    Problem ||--o{ Discussion : "related_to"
    Problem ||--o{ UserSavedProblem : "bookmarked_in"
    Problem ||--o| ProblemSolution : "explains"

    Tag ||--o{ ProblemTag : "categorized_by"
    Discussion ||--o{ Comment : "contains"
    Comment ||--o{ Comment : "replies_to"
    Discussion ||--o{ UserDiscussionInteraction : "receives"
    Comment ||--o{ UserCommentInteraction : "receives"
```

---

### 4.3 Danh sách bảng chi tiết (Data Dictionary)

#### 1. Bảng `users` (Thông tin tài khoản người dùng)
Bảng lưu trữ thông tin định danh người dùng, streak làm bài và vai trò phân quyền.
*   **Tên bảng trong DB**: `users`

| Tên cột | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| **id** | Char(36) | PK, Default UUID | Định danh duy nhất của người dùng |
| **username** | VarChar(50) | Unique, Not Null | Tên đăng nhập của người dùng |
| **email** | VarChar(255) | Unique, Not Null | Địa chỉ email liên kết |
| **password_hash** | VarChar(255) | Not Null | Mật khẩu đã được mã hóa bằng bcrypt |
| **avatar_url** | VarChar(500) | Nullable | Đường dẫn ảnh đại diện |
| **birthday** | Date | Nullable | Ngày sinh |
| **role** | Enum('user', 'admin') | Default 'user' | Vai trò phân quyền trong hệ thống |
| **solved_count** | Int | Default 0 | Tổng số bài tập đã giải quyết thành công |
| **streak_days** | Int | Default 0 | Số ngày làm bài liên tục hiện tại |
| **last_active** | Date | Nullable | Mốc ngày cuối cùng thực hiện nộp bài thành công |
| **created_at** | DateTime | Default now() | Thời gian tạo tài khoản |
| **updated_at** | DateTime | Auto-updated | Thời gian cập nhật gần nhất |

#### 2. Bảng `oauth_accounts` (Tài khoản liên kết bên thứ ba)
Bảng lưu trữ thông tin đăng nhập nhanh qua Google hoặc GitHub.
*   **Tên bảng trong DB**: `oauth_accounts`

| Tên cột | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| **id** | Char(36) | PK, Default UUID | Định danh bản ghi liên kết |
| **user_id** | Char(36) | FK, Not Null | Liên kết tới bảng `users` (Cascade Delete) |
| **provider** | VarChar(32) | Not Null | Nhà cung cấp định danh (google, github) |
| **provider_uid** | VarChar(255) | Not Null | ID người dùng do bên thứ ba cấp |
| **created_at** | DateTime | Default now() | Thời điểm tạo liên kết |

#### 3. Bảng `problems` (Danh sách bài tập thuật toán)
Bảng lưu trữ tiêu đề, mô tả và metadata của bài tập.
*   **Tên bảng trong DB**: `problems`

| Tên cột | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| **id** | Char(36) | PK, Default UUID | Định danh bài tập |
| **title** | VarChar(255) | Not Null | Tiêu đề bài toán |
| **slug** | VarChar(255) | Unique, Not Null | Đường dẫn thân thiện (ví dụ: `two-sum`) |
| **description** | LongText | Not Null | Mô tả chi tiết yêu cầu bài toán (Markdown) |
| **difficulty** | Int | Default 0 | Độ khó (0: Dễ, 1: Trung bình, 2: Khó) |
| **is_active** | Boolean | Default true | Trạng thái hiển thị đối với người dùng |
| **acceptance_rate** | Decimal(5,2) | Default 0.00 | Tỉ lệ nộp bài chính xác (%) |
| **total_accepted** | Int | Default 0 | Tổng số lượt nộp bài đúng |
| **total_submitted** | Int | Default 0 | Tổng số lượt nộp bài |
| **created_by** | Char(36) | FK, Nullable | ID Admin tạo bài tập (SetNull on delete) |
| **metadata** | Json | Nullable | Lưu trữ cấu trúc tham số đầu vào và đầu ra |
| **created_at** | DateTime | Default now() | Thời điểm tạo bài tập |
| **updated_at** | DateTime | Auto-updated | Thời điểm chỉnh sửa gần nhất |

#### 4. Bảng `test_cases` (Danh sách ca kiểm thử dùng để chấm bài)
Bảng lưu trữ đầu vào và đầu ra mong muốn của các ca kiểm thử.
*   **Tên bảng trong DB**: `test_cases`

| Tên cột | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| **id** | Char(36) | PK, Default UUID | Định danh testcase |
| **problem_id** | Char(36) | FK, Not Null | Liên kết tới bảng `problems` (Cascade Delete) |
| **input** | LongText | Not Null | Dữ liệu đầu vào của testcase |
| **expected_output**| LongText | Not Null | Kết quả mong đợi đầu ra |
| **is_hidden** | Boolean | Default false | Ẩn testcase này đi (chỉ dùng khi chấm điểm chính thức) |
| **order_index** | Int | Default 0 | Thứ tự thực hiện testcase |
| **created_at** | DateTime | Default now() | Thời gian tạo |

#### 5. Bảng `code_templates` (Mã nguồn khởi tạo cho các ngôn ngữ)
Bảng chứa starter code hiển thị trên editor và code giải mẫu.
*   **Tên bảng trong DB**: `code_templates`

| Tên cột | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| **id** | Char(36) | PK, Default UUID | Định danh mẫu code |
| **problem_id** | Char(36) | FK, Not Null | Liên kết tới bảng `problems` (Cascade Delete) |
| **language** | Enum | Not Null | Ngôn ngữ áp dụng (cpp, java, python, javascript, typescript) |
| **starter_code** | LongText | Not Null | Mã khung ban đầu hiển thị trên Editor |
| **solution_code** | LongText | Nullable | Code giải mẫu hoàn chỉnh của Admin |

#### 6. Bảng `submissions` (Lịch sử nộp bài của người dùng)
Bảng chứa lịch sử nộp code chấm bài của người học.
*   **Tên bảng trong DB**: `submissions`

| Tên cột | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| **id** | Char(36) | PK, Default UUID | Định danh bài nộp |
| **user_id** | Char(36) | FK, Not Null | Người nộp bài (Cascade Delete) |
| **problem_id** | Char(36) | FK, Not Null | Bài tập tương ứng (Cascade Delete) |
| **language** | Enum | Not Null | Ngôn ngữ lập trình được sử dụng |
| **code** | LongText | Not Null | Toàn bộ mã nguồn do người dùng viết |
| **status** | Enum | Default 'pending' | Trạng thái chấm (accepted, wrong_answer, compile_error, time_limit_exceeded...) |
| **runtime_ms** | Int | Nullable | Thời gian thực thi (mili giây) |
| **memory_kb** | Int | Nullable | Dung lượng bộ nhớ tiêu thụ (Kilobytes) |
| **passed_cases** | Int | Default 0 | Số lượng testcase vượt qua |
| **total_cases** | Int | Default 0 | Tổng số lượng testcase cần kiểm tra |
| **error_message** | Text | Nullable | Nhật ký báo lỗi chi tiết nếu có lỗi biên dịch/runtime |
| **submitted_at** | DateTime | Default now() | Thời điểm nộp bài |

#### 7. Bảng `refresh_tokens` (Quản lý token JWT)
Bảng quản lý việc lưu trữ và xoay vòng Refresh Token để tăng tính bảo mật.
*   **Tên bảng trong DB**: `refresh_tokens`

| Tên cột | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| **id** | Char(36) | PK, Default UUID | Định danh bản ghi token |
| **user_id** | Char(36) | FK, Not Null | Liên kết tới bảng `users` (Cascade Delete) |
| **token_hash** | VarChar(255) | Not Null | Token đã băm bằng thuật toán SHA-256 |
| **expires_at** | DateTime | Not Null | Thời điểm hết hạn của token |
| **revoked** | Boolean | Default false | Cờ xác nhận token đã bị thu hồi/vô hiệu hóa hay chưa |
| **created_at** | DateTime | Default now() | Thời điểm sinh token |

#### 8. Bảng `discussions` (Các bài viết thảo luận/diễn đàn)
Bảng chứa các bài đăng hỏi đáp thuật toán trên diễn đàn.
*   **Tên bảng trong DB**: `discussions`

| Tên cột | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| **id** | Char(36) | PK, Default UUID | Định danh bài thảo luận |
| **problem_id** | Char(36) | FK, Nullable | Liên kết bài tập cụ thể (Null nếu là thảo luận chung) |
| **user_id** | Char(36) | FK, Not Null | Người tạo bài thảo luận |
| **title** | VarChar(255) | Not Null | Tiêu đề bài thảo luận |
| **content** | LongText | Not Null | Nội dung bài viết (Markdown) |
| **tags** | Json | Nullable | Các nhãn bài viết (ví dụ: `["Array", "Dynamic Programming"]`) |
| **is_pinned** | Boolean | Default false | Bài viết có được ghim lên đầu bởi Admin không |
| **is_deleted** | Boolean | Default false | Đánh dấu bài viết đã bị xóa hay chưa |
| **upvotes** | Int | Default 0 | Tổng số lượt ủng hộ |
| **views** | Int | Default 0 | Số lượt xem bài |
| **created_at** | DateTime | Default now() | Thời gian tạo bài viết |

#### 9. Bảng `comments` (Bình luận thảo luận đa cấp)
Bảng chứa các ý kiến đóng góp, bình luận lồng nhau của diễn đàn.
*   **Tên bảng trong DB**: `comments`

| Tên cột | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| **id** | Char(36) | PK, Default UUID | Định danh bình luận |
| **discussion_id**| Char(36) | FK, Not Null | Liên kết tới bài thảo luận gốc (Cascade Delete) |
| **user_id** | Char(36) | FK, Not Null | Người viết bình luận |
| **content** | Text | Not Null | Nội dung bình luận |
| **is_pinned** | Boolean | Default false | Bình luận được ghim lên đầu bởi Admin |
| **parent_id** | Char(36) | FK, Nullable | ID bình luận cha (để trả lời lồng nhau - Cascade Delete) |
| **upvotes** | Int | Default 0 | Số lượt thích bình luận |
| **created_at** | DateTime | Default now() | Thời điểm đăng bình luận |

#### 10. Bảng `user_discussion_interactions` (Tương tác bài viết - Khóa chính kép)
Bảng lưu vết tương tác Upvote/Downvote/Save để chặn spam tương tác.
*   **Tên bảng trong DB**: `user_discussion_interactions`

| Tên cột | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| **user_id** | Char(36) | FK, Composite PK | Người thực hiện tương tác |
| **discussion_id**| Char(36) | FK, Composite PK | Bài viết nhận tương tác |
| **vote_type** | Int | Default 0 | Trạng thái (1: Upvote, -1: Downvote, 0: Hủy bỏ) |
| **is_saved** | Boolean | Default false | Trạng thái lưu bài viết vào danh sách yêu thích |

---

## CHƯƠNG 5. THIẾT KẾ RESTFUL API & GIAO DIỆN HỆ THỐNG

### 5.1 Thiết kế RESTful API chi tiết

Hệ thống giao tiếp thông qua giao thức **RESTful API** với định dạng dữ liệu gửi nhận chuẩn là **JSON**. Dưới đây là mô tả chi tiết danh sách API phân loại theo từng nhóm module:

#### 5.1.1 Nhóm API Xác thực (`/api/auth`)
1.  **Đăng ký tài khoản mới**: `POST /api/register` (Public). Payload nhận `username`, `email`, `password`.
2.  **Đăng nhập hệ thống**: `POST /api/login` (Public). Payload nhận `email`, `password`. Trả về `accessToken`, `refreshToken` và thông tin cơ bản của `user`.
3.  **Làm mới token (Refresh Token)**: `POST /api/refresh-token` (Public). Nhận `refreshToken` cũ, trả về `accessToken` mới và xoay vòng Refresh Token.
4.  **Đăng xuất tài khoản**: `POST /api/logout` (Yêu cầu Access Token). Thu hồi toàn bộ Refresh Tokens của User trong DB.

#### 5.1.2 Nhóm API Quản lý bài tập (`/api/problems`)
1.  **Lấy danh sách bài tập**: `GET /api/problems?page=1&limit=20&difficulty=0&search=Two+Sum` (Public/User). Trả về danh sách bài tập phân trang kèm trạng thái đã làm hay chưa nếu người dùng đăng nhập.
2.  **Lấy chi tiết bài tập theo Slug hoặc ID**: `GET /api/problems/:id` (Public). Trả về mô tả đề bài, ví dụ, ràng buộc và starter code.
3.  **Thêm mới bài tập thủ công**: `POST /api/problems/import` (Admin only). Nhận thông tin đề bài, testcases, templates và ghi nhận vào DB.

#### 5.1.3 Nhóm API Thực thi mã nguồn (`/api/execute`)
1.  **Chạy thử hoặc Nộp bài tập**: `POST /api/execute/run` (Public/User).
    *   **Payload**: `problemId`, `language`, `code`, `isSubmit` (true/false).
    *   **Response**: `status` (accepted, wrong_answer, compile_error, time_limit_exceeded, memory_limit_exceeded), `passedCases`, `totalCases`, `testCaseResults`.

#### 5.1.4 Nhóm API Diễn đàn Thảo luận (`/api/discussions`)
1.  **Đăng bài viết mới**: `POST /api/discussions` (User/Admin). Nhận `title`, `content` (Markdown), `tags`, `problemId`.
2.  **Viết bình luận / Trả lời bình luận**: `POST /api/discussions/:id/comments` (User/Admin). Hỗ trợ trả lời lồng nhau bằng cách truyền `parentId`.
3.  **Bình chọn (Upvote / Downvote) bài viết hoặc bình luận**: `POST /api/discussions/:id/interact` hoặc `POST /api/discussions/:id/comments/:commentId/interact` (User/Admin). Nhận `voteType` (1, -1, 0) để cập nhật điểm uy tín.

#### 5.1.5 Nhóm API Tiền trình cào dữ liệu (`/api/admin/scraper`)
1.  **Khởi động tiến trình cào dữ liệu từ LeetCode**: `POST /api/admin/scraper/start` (Admin only). Nhận `problemSlug`.
2.  **Stream tiến trình theo thời gian thực (SSE)**: `GET /api/admin/scraper/progress` (Admin only). Thiết lập kênh Server-Sent Events để cập nhật % tiến độ cào bài tập lên giao diện Admin.

---

### 5.2 Sơ đồ luồng giao diện (Sitemap) & Mô tả màn hình

#### 5.2.1 Sơ đồ Sitemap chuyển hướng màn hình

```mermaid
graph TD
    Home[1. Trang chủ Dashboard]
    Problems[2. Danh sách bài tập]
    Workspace[3. Không gian giải bài]
    Discuss[4. Diễn đàn thảo luận]
    Profile[5. Trang cá nhân User]
    Admin[6. Trang quản lý Admin]

    Home -->|Click Bài tập| Problems
    Home -->|Click Diễn đàn| Discuss
    Home -->|Ghim Thông báo| Home
    Problems -->|Chọn 1 Bài tập| Workspace
    Discuss -->|Click Bài đăng| Discuss
    Home -->|Click Avatar| Profile
    Home -->|Chuyển quyền| Admin
```

#### 5.2.2 Mô tả chi tiết các màn hình chính
*   **Trang chủ (Dashboard)**: Tích hợp bảng danh sách thông báo quan trọng được ghim, danh mục xu hướng thảo luận nóng hổi bên trái. Bên phải là thanh tiện ích hiển thị ngọn lửa Streak động, nút làm bài tập ngẫu nhiên (Pick One) và bảng xếp hạng thành viên năng nổ nhất.
*   **Trang danh sách bài tập (Problems List)**: Trực quan hóa dưới dạng bảng bao gồm trạng thái giải bài, tên bài, độ khó (Xanh/Vàng/Đỏ), tỷ lệ giải đúng. Cho phép tìm kiếm nhanh theo ký tự và lọc nâng cao theo độ khó hoặc chủ đề bài tập.
*   **Không gian giải bài (Problem Workspace)**: Layout chia đôi màn hình co giãn linh hoạt. Bên trái hiển thị mô tả bài toán, gợi ý và bình luận của bài tập đó. Bên phải tích hợp Monaco Editor chuyên nghiệp hỗ trợ 5 ngôn ngữ, console tùy chỉnh testcase đầu vào, kết quả phản hồi chạy code (Run Code) và tab lịch sử nộp bài cũ.
*   **Diễn đàn thảo luận (Discuss Hub)**: Trình bày theo dạng thẻ bài viết Reddit-style, hỗ trợ bình chọn điểm bài viết, tìm kiếm bài đăng theo tag và bình luận đa cấp lồng ghép không giới hạn.
*   **Trang cá nhân (User Profile)**: Thống kê tổng số streak làm bài và tổng số bài đã giải quyết. Tích hợp biểu đồ tròn phân chia tỷ lệ bài đã làm theo cấp độ Dễ/Trung bình/Khó và danh mục bài tập đã đánh dấu bookmark.
*   **Trang quản trị viên (Admin Dashboard)**: Tổng hợp biểu đồ số lượng người dùng và hiệu suất máy chủ Docker. Cung cấp giao diện quản lý đề thi thủ công và màn hình Scraper Tool cào bài tự động từ LeetCode qua thanh tiến trình SSE.

---

## CHƯƠNG 6. CÔNG NGHỆ SỬ DỤNG & LÝ DO LỰA CHỌN

### 6.1 Bảng phân tích công nghệ lựa chọn

| Thành phần | Công nghệ | Vai trò trong hệ thống | Lý do lựa chọn |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 15 (React 19) | Xây dựng giao diện Web App. | Hỗ trợ Server-Side Rendering tối ưu SEO, hiệu năng load trang nhanh, cấu trúc thư mục App Router tối giản quản lý routing. |
| **UI Styling**| Tailwind CSS | Thiết kế giao diện responsive và Dark Mode. | Tiết kiệm thời gian viết CSS thuần, tùy biến theme màu sắc dễ dàng, giảm kích thước file CSS xuất ra môi trường production. |
| **Code Editor**| Monaco Editor | Trình soạn thảo mã nguồn trực tuyến. | Cung cấp trải nghiệm viết code chuyên nghiệp giống VS Code, tích hợp highlight cú pháp, phím tắt và auto-completion. |
| **Backend** | Node.js (ExpressJS) | Viết RESTful API phục vụ client. | Runtime nhẹ nhàng, xử lý I/O bất đồng bộ (Asynchronous) rất tốt, phù hợp cho việc gọi tiến trình con (Docker CLI spawn) để chạy code. |
| **Database** | MySQL | Lưu trữ dữ liệu quan hệ có cấu trúc. | Ổn định, miễn phí mã nguồn mở, tài nguyên chạy cực nhẹ (50MB - 100MB RAM), tương thích hoàn hảo trong môi trường Docker hóa. |
| **Database ORM**| Prisma ORM | Tương tác cơ sở dữ liệu. | Type safety tuyệt đối giúp tránh lỗi chính tả trường dữ liệu từ lúc code, tự động sinh migration cơ sở dữ liệu an toàn, chống SQL Injection mặc định. |
| **Sandbox** | Docker Engine | Môi trường thực thi code cô lập. | Tạo môi trường ảo hóa siêu nhẹ cô lập tiến trình code người dùng nộp lên, giới hạn tài nguyên RAM và tắt mạng để bảo mật tuyệt đối. |

### 6.2 Lý do lựa chọn chi tiết các thành phần chính

#### 6.2.1 Tại sao chọn ExpressJS thay vì Spring Boot cho dự án này?
1.  **Tối ưu hóa tài nguyên hệ thống**: Spring Boot (Java) yêu cầu tài nguyên phần cứng lớn, mất từ 500MB đến 1GB RAM tối thiểu để khởi động và vận hành ổn định. Ngược lại, ExpressJS (Node.js) cực kỳ gọn nhẹ, chỉ tiêu tốn khoảng 40MB - 80MB RAM khi chạy, rất phù hợp khi deploy trên các máy chủ đám mây VPS giá rẻ (1 vCPU, 1GB RAM) hoặc máy tính cá nhân cấu hình thấp.
2.  **Khả năng xử lý các tác vụ I/O bất đồng bộ**: Bản chất của một Online Judge là liên tục gọi các tiến trình Docker container chấm bài (mất nhiều thời gian I/O). Cơ chế Non-blocking Event Loop của Node.js xử lý hàng loạt tiến trình I/O song song bất đồng bộ cực kỳ xuất sắc mà không gây treo server như mô hình đa luồng đồng bộ truyền thống của Java nếu cấu hình không chuẩn.
3.  **Tốc độ phát triển nhanh (Time to Market)**: Sử dụng JavaScript/TypeScript đồng bộ trên cả Frontend và Backend giúp tiết kiệm thời gian phát triển, đồng bộ hóa các model dữ liệu dễ dàng và thuận tiện cho các nhóm phát triển nhỏ.

#### 6.2.2 Tại sao chọn MySQL thay vì SQL Server (MSSQL)?
*   **Bản quyền**: MySQL hoàn toàn miễn phí mã nguồn mở (GPL), giúp doanh nghiệp/trường học tiết kiệm hoàn toàn chi phí bản quyền thương mại đắt đỏ của Microsoft SQL Server.
*   **Tương thích đa nền tảng**: MySQL hoạt động hoàn hảo trên môi trường Linux (môi trường server thực tế phổ biến nhất). Bản SQL Server dành cho Linux/Docker rất nặng nề và thiếu ổn định.
*   **Chi phí vận hành**: MySQL khởi chạy chỉ tốn dưới 100MB RAM, trong khi SQL Server cần tối thiểu 1GB - 2GB RAM để vận hành trơn tru.

#### 6.2.3 Tại sao chọn Prisma ORM thay vì viết SQL thuần (Raw SQL)?
*   **Type Safety**: Prisma tự động sinh các kiểu dữ liệu tương ứng dựa trên `schema.prisma`. Trình soạn thảo (IDE) tự gợi ý tên bảng, tên cột giúp lập trình viên không gõ nhầm.
*   **Migration tự động**: Quản lý lịch sử thay đổi cấu trúc bảng qua lệnh `prisma migrate dev` chuẩn xác, tránh rủi ro gõ sai lệnh ALTER TABLE bằng tay.
*   **Miễn dịch SQL Injection**: Mọi tham số truyền vào câu lệnh truy vấn đều được tự động chuyển đổi sang dạng tham số hóa (Parameterized queries) ở mức Driver database, ngăn chặn hoàn toàn việc kẻ xấu tiêm các đoạn mã SQL phá hoại.

---

## CHƯƠNG 7. CÀI ĐẶT VÀ TRIỂN KHAI HỆ THỐNG

### 7.1 Cấu trúc thư mục mã nguồn

Dự án được tổ chức dưới dạng Monorepo tiện lợi cho việc quản lý mã nguồn:

```
leetcode/
├── leetcode_clone/             # Mã nguồn Frontend (Next.js)
│   ├── app/                    # Next.js App Router (Dashboard, Problems, Profile, Discuss, Admin)
│   ├── components/             # Các UI Components (Editor, Console, Announcement, Leaderboard...)
│   └── public/                 # File tĩnh (ảnh, icons)
│
├── leetcode_clone_be_cus/      # Mã nguồn Backend (Express.js)
│   ├── prisma/                 # Schema cấu trúc Database (schema.prisma) & Migrations
│   ├── src/
│   │   ├── config/             # Cấu hình Database & Docker Sandbox
│   │   ├── controllers/        # Tiếp nhận request & trả JSON
│   │   ├── services/           # Xử lý Logic nghiệp vụ (Execution, Scraper, Streak, Auth...)
│   │   ├── repositories/       # Tầng truy cập DB qua Prisma
│   │   ├── routes/             # Định nghĩa API endpoints
│   │   ├── utils/              # Tiện ích (docker.util.js, formatter.util.js...)
│   │   └── middleware/         # Xác thực JWT, phân quyền Admin
│   ├── Dockerfile.cpp          # Custom image cho môi trường chạy C++
│   ├── Dockerfile.java         # Custom image cho môi trường chạy Java
│   ├── Dockerfile.ts           # Custom image cho môi trường chạy TypeScript
│   └── server.js               # Điểm chạy Server Backend chính
```

---

### 7.2 Hướng dẫn thiết lập môi trường & file cấu hình `.env`

Để hệ thống chạy chính xác, lập trình viên tạo file `.env` tại thư mục backend `leetcode_clone_be_cus`:

```env
# URL kết nối cơ sở dữ liệu MySQL
DATABASE_URL="mysql://root:matkhaucuaban@localhost:3306/leetcode_db"

PORT=5000
HOST=localhost

# Cấu hình JWT an toàn
JWT_SECRET="mot_chuoi_chu_ky_ngau_nhien_sieu_bao_mat_32_ky_tu"
JWT_REFRESH_SECRET="mot_chuoi_chu_ky_refresh_ngau_nhien_sieu_bao_mat"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

Tại thư mục Frontend `leetcode_clone`, tạo file `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

---

### 7.3 Quy trình Dockerize & Build Sandbox Images

Để Sandbox có thể chấm code trực tuyến, máy chủ cần khởi chạy Docker Desktop/Docker Engine và xây dựng các images chứa môi trường biên dịch:

1.  **Tải các base images tối giản từ Docker Hub**:
    ```bash
    docker pull python:3.9-slim
    docker pull node:18-alpine
    ```
2.  **Build các Custom Docker Images tích hợp thư viện chấm bài**:
    *   **C++ (sử dụng gcc + nlohmann/json)**:
        ```bash
        docker build -t gcc-leetcode -f Dockerfile.cpp .
        ```
    *   **Java (sử dụng openjdk + Gson.jar)**:
        ```bash
        docker build -t java-leetcode -f Dockerfile.java .
        ```
    *   **TypeScript (sử dụng node + typescript compiler)**:
        ```bash
        docker build -t ts-leetcode -f Dockerfile.ts .
        ```
3.  **Kiểm tra tính sẵn sàng**: Chạy lệnh `docker images`, đảm bảo các ảnh `gcc-leetcode`, `java-leetcode`, `ts-leetcode`, `python` và `node` đã sẵn sàng hoạt động trên máy chủ.

---

## CHƯƠNG 8. KẾT QUẢ ĐẠT ĐƯỢC & GIAO DIỆN CHƯƠNG TRÌNH

### 8.1 Trạng thái hoàn thành tính năng

Hệ thống đã hoàn thiện tất cả các chức năng cốt lõi đề ra cho một Online Judge chuyên nghiệp:

| Nhóm chức năng | Chức năng cụ thể | Trạng thái |
| :--- | :--- | :--- |
| **Xác thực** | Đăng ký, Đăng nhập thông thường, mã hóa bcrypt | ✅ Hoàn thành |
| **Xác thực nâng cao** | Xoay vòng Refresh Token (RTR), Đăng xuất thu hồi token | ✅ Hoàn thành |
| **Quản lý bài tập** | Tìm kiếm bài tập, Lọc theo độ khó, Lọc theo thẻ Tag | ✅ Hoàn thành |
| **Chấm bài tự động** | Chạy thử (Run Code), Nộp bài chính thức (Submit Code) | ✅ Hoàn thành |
| **Docker Sandbox** | Cô lập mạng, giới hạn 256MB RAM, timeout 2 giây | ✅ Hoàn thành |
| **Chống phình DB** | Tự động giới hạn lưu 20 submissions/bài tập của User | ✅ Hoàn thành |
| ** Streak ngày** | Thuật toán streak timezone-safe theo múi giờ Việt Nam | ✅ Hoàn thành |
| **Diễn đàn** | Tạo bài viết Markdown, Bình luận lồng nhau đa cấp | ✅ Hoàn thành |
| **Tương tác** | Upvote/Downvote bài viết/comment có khóa chống spam | ✅ Hoàn thành |
| **Hồ sơ cá nhân** | Đổi avatar, biểu đồ thống kê tỉ lệ bài giải tròn trực quan | ✅ Hoàn thành |
| **Quản trị Scraper** | Cào đề tự động từ LeetCode qua cơ chế real-time SSE | ✅ Hoàn thành |

### 8.2 Mô tả kết quả giao diện chương trình
*   **Giao diện đăng nhập / đăng ký**: Form đăng nhập tối giản và hiện đại, bảo vệ mật khẩu, hỗ trợ chuyển đổi giao diện mượt mà.
*   **Giao diện danh sách bài tập**: Bảng bài tập trực quan hiển thị rõ cấp độ, tỷ lệ giải đúng và trạng thái của riêng user hiện tại.
*   **Giao diện Workspace**: Thiết kế Split Pane kéo giãn linh hoạt. Tích hợp Monaco Editor đầy đủ tính năng soạn thảo thông minh. Console hiển thị kết quả testcases so sánh kết quả thực tế và kết quả mong muốn trực quan.
*   **Giao diện Diễn đàn thảo luận**: Bố cục Reddit-style giúp người học dễ dàng trao đổi giải thuật, hỗ trợ xem trước bài viết định dạng Markdown trước khi đăng.
*   **Giao diện Scraper Tool của Admin**: Giao diện trực quan tích hợp thanh tiến trình tải dữ liệu thời gian thực chạy bằng SSE.

---

## CHƯƠNG 9. KỊCH BẢN KIỂM THỬ CHI TIẾT (TEST CASES)

Dưới đây là danh sách các kịch bản kiểm thử (Test cases) mẫu dùng để kiểm chứng độ tin cậy và chính xác của hệ thống:

### 9.1 Kịch bản kiểm thử (Test Cases)

#### 9.1.1 Đăng nhập hệ thống
*   **Mục tiêu**: Đảm bảo người dùng đăng nhập thành công với mật khẩu đúng và bị chặn khi nhập sai thông tin.
*   **Dữ liệu đầu vào**: `email = "duynq@example.com"`, `password = "StrongPassword123"`.
*   **Các bước thực hiện**:
    1. Truy cập trang đăng nhập `/login`.
    2. Điền thông tin Email và Password hợp lệ. Nhấn nút "Đăng nhập".
*   **Kết quả mong đợi**: Hệ thống chuyển hướng về trang chủ Dashboard, trả về Access Token + Refresh Token trong bộ nhớ, hiển thị đúng Avatar người dùng.
*   **Kết quả thực tế**: Pass.

#### 9.1.2 Chạy thử mã nguồn (Run Code)
*   **Mục tiêu**: Đảm bảo người dùng chạy thử code thành công với testcase mẫu mà không làm thay đổi Streak hay lịch sử nộp bài trong DB.
*   **Dữ liệu đầu vào**: Bài tập "Two Sum", ngôn ngữ Python, mã nguồn chính xác. `isSubmit = false`.
*   **Các bước thực hiện**:
    1. Vào không gian giải bài của bài "Two Sum".
    2. Nhập code giải thuật đúng bằng Python. Nhấn nút **Run Code**.
*   **Kết quả mong đợi**: Console hiển thị kết quả biên dịch thành công, hiển thị chi tiết 3 testcase mẫu đúng 100%. Bảng `submissions` không sinh thêm bản ghi mới.
*   **Kết quả thực tế**: Pass.

#### 9.1.3 Nộp bài chính thức thành công (Submit Code - Accepted)
*   **Mục tiêu**: Nộp code đúng, hệ thống chạy qua toàn bộ testcases ẩn, lưu lịch sử nộp bài và cộng Streak.
*   **Dữ liệu đầu vào**: Bài "Two Sum", ngôn ngữ Python, mã nguồn chính xác. `isSubmit = true`.
*   **Các bước thực hiện**:
    1. Nhấn nút **Submit** trên Workspace bài "Two Sum".
*   **Kết quả mong đợi**: Trả về trạng thái `Accepted`. Cột `solved_count` của User tăng thêm 1 (nếu là lần đầu làm bài này). Cột `streak_days` tăng thêm 1. Ghi nhận 1 bản ghi mới vào bảng `submissions`.
*   **Kết quả thực tế**: Pass.

#### 9.1.4 Nộp bài chứa lỗi cú pháp (Compile Error)
*   **Mục tiêu**: Hệ thống phát hiện lỗi biên dịch từ Docker Compiler và trả về thông báo lỗi chi tiết cho lập trình viên.
*   **Dữ liệu đầu vào**: Bài "Two Sum", ngôn ngữ C++, code thiếu dấu chấm phẩy `;` ở dòng cuối. `isSubmit = true`.
*   **Các bước thực hiện**:
    1. Nhập code C++ bị lỗi cú pháp vào editor. Nhấn **Submit**.
*   **Kết quả mong đợi**: Trả về trạng thái `Compile Error`. Hiển thị chi tiết lỗi biên dịch của `g++` trong Console. Bản ghi submission lưu trạng thái lỗi cú pháp.
*   **Kết quả thực tế**: Pass.

#### 9.1.5 Nộp bài chứa vòng lặp vô hạn (Time Limit Exceeded - TLE)
*   **Mục tiêu**: Chặn đứng code chạy vòng lặp vô hạn không gây treo máy chủ bằng cơ chế timeout của Sandbox.
*   **Dữ liệu đầu vào**: Ngôn ngữ C++, code chứa vòng lặp `while(true)`. `isSubmit = true`.
*   **Các bước thực hiện**:
    1. Nhập code vòng lặp vô hạn vào editor. Nhấn **Submit**.
*   **Kết quả mong đợi**: Sau tối đa 2 giây chạy trong Container, tiến trình bị Docker Force Kill. Trả về trạng thái `Time Limit Exceeded`. Hệ thống không bị treo hoặc chậm lại.
*   **Kết quả thực tế**: Pass.

#### 9.1.6 Nộp bài tiêu tốn bộ nhớ quá mức (Memory Limit Exceeded - MLE)
*   **Mục tiêu**: Container tự động crash khi vượt quá giới hạn 256MB RAM để bảo vệ tài nguyên Server Host.
*   **Dữ liệu đầu vào**: Ngôn ngữ Python, code khai báo danh sách cực lớn liên tục trong vòng lặp nhằm ngốn RAM. `isSubmit = true`.
*   **Các bước thực hiện**:
    1. Nhập code ngốn RAM vào editor. Nhấn **Submit**.
*   **Kết quả mong đợi**: Docker container bị crash ngay lập tức do vượt quá giới hạn cấu hình `--memory=256m`. Trả về trạng thái `Memory Limit Exceeded`. Máy chủ Host vẫn hoạt động ổn định.
*   **Kết quả thực tế**: Pass.

#### 9.1.7 Đăng bài viết & Bình luận thảo luận
*   **Mục tiêu**: Đăng tải thảo luận bằng Markdown thành công, bình luận đa cấp hoạt động trơn tru.
*   **Dữ liệu đầu vào**: Bài viết chứa tiêu đề và nội dung Markdown hợp lệ, bình luận reply của một user khác.
*   **Các bước thực hiện**:
    1. Vào diễn đàn, tạo bài viết mới và gửi.
    2. Sử dụng tài khoản khác bình luận vào bài viết, sau đó phản hồi (Reply) bình luận đó.
*   **Kết quả mong đợi**: Bài viết hiển thị đúng định dạng Markdown. Các bình luận lồng nhau thụt lề chuẩn xác theo cấu trúc cây phân cấp DB.
*   **Kết quả thực tế**: Pass.

### 9.2 Đánh giá kết quả kiểm thử
Qua quá trình chạy thử tất cả các kịch bản kiểm thử cốt lõi, hệ thống cho thấy độ tin cậy tuyệt đối:
*   Mọi trường hợp code lỗi hoặc tấn công treo hệ thống đều bị chặn đứng ở tầng Docker Sandbox.
*   Dữ liệu được cập nhật đồng bộ, chính xác và không bị rò rỉ hoặc rớt kết nối.

---

## CHƯƠNG 10. ĐÁNH GIÁ HIỆU NĂNG & BENCHMARK

Hệ thống được chạy thử nghiệm trên máy chủ kiểm thử tiêu chuẩn cấu hình: **1 vCPU, 1GB RAM (Cloud VPS)** chạy hệ điều hành Ubuntu Server.

### 10.1 Đo lường thời gian thực thi của từng ngôn ngữ trong Sandbox

Thời gian chấm bài (bao gồm: Khởi động container -> Biên dịch code -> Thực thi testcases -> So sánh kết quả -> Trả về kết quả) được đo lường trung bình qua 100 lần nộp bài:

| Ngôn ngữ lập trình | Thời gian chấm trung bình (Giây) | Cơ chế xử lý | Đánh giá hiệu năng |
| :--- | :--- | :--- | :--- |
| **Python** | **0.65 giây** | Thông dịch trực tiếp (diễn dịch mã nguồn siêu tốc). | Cực kỳ nhanh, phản hồi lập tức. |
| **JavaScript** | **0.72 giây** | Chạy trực tiếp bằng Node.js Container. | Nhanh và ổn định. |
| **TypeScript** | **1.35 giây** | Biên dịch từ `.ts` sang `.js` trước khi thực thi. | Khá tốt, mất thêm thời gian biên dịch của tsc. |
| **C++** | **1.15 giây** | Biên dịch bằng `g++ -O3` trước khi thực thi file nhị phân. | Tối ưu hóa thực thi tốt, file binary chạy chỉ mất 2-5ms. |
| **Java** | **1.55 giây** | Biên dịch bằng `javac` và thực thi trên máy ảo JVM. | Chậm nhất do máy ảo JVM mất thời gian khởi động nặng nề. |

### 10.2 Đo lường khả năng chịu tải đồng thời (Concurrency Benchmarking)

Sử dụng công cụ Apache Benchmark (ab) để giả lập các request gửi đồng thời lên endpoint lấy danh sách bài tập (`GET /api/problems`) và endpoint nộp bài (`POST /api/execute/run`):

#### 1. Lấy danh sách bài tập (1000 bản ghi dữ liệu mẫu trong DB)
*   **Tham số**: Gửi 1000 requests đồng thời, mức độ đồng thời (Concurrency Level) = 100.
*   **Thời gian phản hồi trung bình (Response Time)**: **185ms**.
*   **Tỷ lệ lỗi**: 0%.
*   **Nhận xét**: Prisma Client kết hợp với MySQL indexing trên cột `difficulty` và `slug` giúp truy vấn danh sách bài tập cực nhanh, không gây nghẽn cổ chai.

#### 2. Giả lập nộp bài chấm code đồng thời (Docker Container Spawning)
*   **Tham số**: Gửi 50 requests nộp bài Python đồng thời.
*   **Thời gian phản hồi trung bình**: **1.45s**.
*   **Tỷ lệ lỗi**: 0%.
*   **Nhận xét**: Hệ thống xử lý mượt mà nhờ cơ chế Node.js spawn tiến trình bất đồng bộ. Docker khởi chạy song song các container nhanh chóng mà không làm tràn bộ nhớ RAM máy chủ (do mỗi container giới hạn chặt chẽ 256MB RAM).

---

## CHƯƠNG 11. HẠN CHẾ VÀ HƯỚNG PHÁT TRIỂN

### 11.1 Hạn chế hiện tại
Mặc dù hệ thống đã đáp ứng đầy đủ yêu cầu của một Online Judge cơ bản, vẫn còn tồn tại một số hạn chế cần cải thiện:
1.  **Chưa hỗ trợ nhiều ngôn ngữ lập trình nâng cao**: Hệ thống hiện tại mới chỉ hỗ trợ 5 ngôn ngữ cốt lõi (C++, Java, Python, JavaScript, TypeScript), chưa hỗ trợ các ngôn ngữ hiện đại khác như Go, Rust, C# hay Swift.
2.  **Chưa tích hợp module Thi đấu trực tuyến (Contest)**: Người dùng mới chỉ có thể làm bài tập cá nhân, chưa thể tham gia các kỳ thi lập trình thời gian thực có bảng xếp hạng cập nhật liên tục qua WebSockets.
3.  **Hiệu năng I/O đĩa cứng khi chấm bài**: Việc liên tục ghi file code tạm thời của người học lên ổ đĩa vật lý của máy chủ trước khi mount vào Docker làm giảm tuổi thọ ổ cứng và hạn chế tốc độ chấm bài nếu số lượng người dùng đồng thời tăng lên hàng ngàn người.

### 11.2 Hướng phát triển tương lai

#### 11.2.1 Mở rộng ngôn ngữ chấm điểm (Multi-language Judge)
*   Xây dựng thêm các Dockerfile cấu hình sẵn môi trường biên dịch cho Go (`golang:alpine`), Rust (`rust:alpine`) để đa dạng hóa sự lựa chọn cho các lập trình viên chuyên nghiệp.

#### 11.2.2 Tích hợp tính năng thi đấu thời gian thực (Real-time Contest)
*   Sử dụng công cụ **Socket.io (WebSockets)** để xây dựng tính năng Contest. Cho phép Admin tạo phòng thi, tự động tính điểm theo thời gian giải quyết bài toán và cập nhật bảng xếp hạng thi đấu của các thí sinh theo thời gian thực (Real-time Leaderboard).

#### 11.2.3 Trợ lý học tập thông minh bằng trí tuệ nhân tạo (AI Assistant & Hint)
*   Kích hoạt các endpoint tích hợp API mô hình ngôn ngữ lớn (LLM) như **Gemini 3.5 Flash** (sử dụng khóa API đã cấu hình sẵn trong biến môi trường) để:
    *   **AI Solution Generator**: Tự động phân tích và sinh mã giải mẫu tối ưu kèm giải thích chi tiết cho từng bài tập.
    *   **AI Hint System**: Khi người dùng nộp bài sai quá 3 lần, AI sẽ đọc mã nguồn lỗi của họ và đưa ra các gợi ý logic (không cho trực tiếp code sửa) giúp người dùng tự sửa lỗi tư duy thuật toán.

#### 11.2.4 Tối ưu hóa lưu trữ I/O bằng RAM Disk
*   Thay vì ghi file tạm trên ổ cứng vật lý (SSD/HDD), cấu hình phân vùng bộ nhớ RAM tạm thời (**tmpfs**) trên Linux Server để lưu các file code chạy tạm. RAM Disk có tốc độ đọc ghi dữ liệu nhanh gấp hàng chục lần SSD và không làm hao mòn ổ đĩa cứng vật lý của hệ thống, giúp nâng cao đáng kể tần suất chấm bài đồng thời.
