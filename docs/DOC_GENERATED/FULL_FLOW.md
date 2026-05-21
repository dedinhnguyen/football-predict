# Quy Trình Triển Khai Chi Tiết (FULL FLOW)

Tài liệu này tổng hợp toàn bộ các giai đoạn phát triển và logic nghiệp vụ đã được triển khai hoàn tất cho ứng dụng **Quản lý Dự Đoán Tỉ Số Bóng Đá** (React + Firebase Auth + Firebase Cloud Firestore - 100% Firebase Architecture).

---

## ⚽ GIAI ĐOẠN 1: Khởi tạo Project & Quản lý Đăng nhập (Auth Flow)
* **Khởi tạo môi trường**:
  * Dự án được thiết lập sử dụng **React + Vite + TypeScript**.
  * Cài đặt và cấu hình **Tailwind CSS v4** với thiết kế Glassmorphic cao cấp (Dark Mode mặc định, sử dụng phông chữ Inter và các bóng đổ hiệu ứng chiều sâu).
* **Quản lý trạng thái Auth (Firebase Authentication & Cloud Firestore)**:
  * Tích hợp SDK Firebase (`firebase`) để xử lý cả phần Xác thực (Auth) và Lưu trữ cơ sở dữ liệu (Firestore).
  * Khởi tạo file cấu hình kết nối [firebase.ts](file:///e:/Ai%20dev%20github/football-predict/src/lib/firebase.ts) lấy biến môi trường từ tệp `.env.local`.
  * Xây dựng [AuthContext.tsx](file:///e:/Ai%20dev%20github/football-predict/src/context/AuthContext.tsx) quản lý trạng thái đăng nhập thời gian thực thông qua Firebase `onAuthStateChanged`.
  * Tự động đồng bộ và khởi tạo hồ sơ người dùng trong collection `users` trên Firestore ngay trong lần đầu đăng nhập bằng **Google Account** (Sử dụng Popup đăng nhập `signInWithPopup` của Firebase Auth).
  * Lắng nghe cập nhật thông tin cá nhân của người dùng real-time từ collection `users` của Firestore qua hàm `onSnapshot` để đồng bộ điểm số và quyền admin tức thì.
  * Xây dựng Component [ProtectedRoute.tsx](file:///e:/Ai%20dev%20github/football-predict/src/components/ProtectedRoute.tsx) để bảo vệ các tuyến đường yêu cầu xác thực người dùng và phân quyền quản trị viên (Admin).

---

## 🛠️ GIAI ĐOẠN 2: Dashboard cho Quản trị viên (Admin Dashboard)
* **Xây dựng các Service tương tác Firestore**:
  * [firebase.ts](file:///e:/Ai%20dev%20github/football-predict/src/lib/firebase.ts): Khởi tạo Firestore db sử dụng `getFirestore`.
  * [matchService.ts](file:///e:/Ai%20dev%20github/football-predict/src/lib/services/matchService.ts): Xử lý CRUD trận đấu trong collection `matches` (`createMatch`, `deleteMatch`, `updateMatchStatus`).
  * [settingsService.ts](file:///e:/Ai%20dev%20github/football-predict/src/lib/services/settingsService.ts): Quản lý cấu hình tiêu đề trang và ảnh nền chung của ứng dụng từ document `settings/app`.
* **Phân quyền người dùng & Bảo mật vai trò**:
  * Mặc định khi đăng ký tài khoản (đăng nhập lần đầu qua Google OAuth), tài khoản mới luôn được gán vai trò `user` (`role: 'user'`).
  * Chỉ Admin mới có quyền cấp quyền quản trị bằng cách truy cập trực tiếp vào Firestore Database Console và chỉnh sửa thuộc tính `role` của user tương ứng thành `'admin'`. Hoàn toàn không có tùy chọn tự thay đổi vai trò trên giao diện client để tránh lỗ hổng bảo mật.
* **Giao diện trang Admin `/admin`**:
  * [Admin.tsx](file:///e:/Ai%20dev%20github/football-predict/src/pages/Admin.tsx) được phân làm 3 module chính:
    1. **Quản lý trận đấu**: Xem danh sách trận đấu và điều phối trạng thái (`scheduled` -> `live` -> `completed`). Khi chuyển sang `completed`, hiển thị Modal nhập tỉ số và chọn đội thắng kèo.
    2. **Thêm trận đấu**: Form nhập tên đội, tỉ lệ chấp, ngày giờ thi đấu. Hỗ trợ tính năng kéo thả upload ảnh để **mã hóa sang Base64** hoặc dán URL ảnh trực tiếp.
    3. **Cấu hình ứng dụng**: Đổi tiêu đề ứng dụng và ảnh nền tổng thể. Toàn bộ người dùng trực tuyến sẽ được cập nhật giao diện ngay lập tức nhờ cơ chế lắng nghe real-time `onSnapshot` của Firestore.

---

## 🎮 GIAI ĐOẠN 3: Sàn Dự Đoán cho Người dùng (Prediction Floor)
* **Xử lý logic Đặt cược**:
  * [predictionService.ts](file:///e:/Ai%20dev%20github/football-predict/src/lib/services/predictionService.ts): Lưu trữ dự đoán của user vào collection `predictions` với ID của document được đặt theo dạng ghép `${userId}_${matchId}` để đảm bảo không bị tạo trùng lặp và dễ dàng truy vấn.
  * **Giới hạn tối đa 2 lần sửa cược**: Tự động tăng biến đếm `modificationCount` khi cập nhật dự đoán. Chặn cập nhật từ phía client và throw lỗi nếu vượt quá 2 lần.
* **Logic tự động khóa cược**:
  * Tính toán thời gian khóa cược linh hoạt dựa trên cấu hình số phút do Admin đặt (Ví dụ: trước giờ bóng lăn 15 phút) hoặc khi trận đấu được Admin bấm chuyển sang trạng thái `live` hay `completed`.
  * Bộ đếm thời gian hệ thống được tích hợp chạy ngầm mỗi 5 giây trên trang chủ để vô hiệu hóa cược tự động khi hết giờ cược.
* **Đổi màu cược theo trạng thái**:
  * Khi trận đấu kết thúc (`completed`), thẻ cược của người dùng sẽ hiển thị màu **Xanh lá (Emerald)** nếu đoán chính xác tỉ số kèo chấp và **Đỏ (Red)** nếu đoán sai.

---

## 📊 GIAI ĐOẠN 4: Bảng Xếp Hạng Excel & Trả Điểm Tự Động (Leaderboard)
* **Giao dịch xử lý điểm cược bằng Firestore Transactions**:
  * Khi Admin bấm kết thúc trận đấu, thay vì chạy cập nhật không đồng bộ riêng rẽ từ client, ứng dụng sử dụng **Firestore Transaction (`runTransaction`)** để xử lý điểm số an toàn.
  * Giao dịch này bao gồm:
    1. Đọc dữ liệu trạng thái trận đấu hiện tại để tránh việc hoàn thành trùng lặp.
    2. Đọc thông tin hồ sơ của toàn bộ người chơi đã thực hiện dự đoán trận đấu đó để lấy điểm số hiện tại.
    3. Thực hiện cập nhật đồng thời: Đổi trạng thái trận đấu thành `completed` và ghi nhận kết quả, đánh giá đúng/sai cho các dự đoán (`isCorrect`), và tăng điểm tích lũy (`totalPoints = totalPoints + 1`) cho các tài khoản người dùng đoán chính xác.
  * Việc sử dụng Firestore Transaction giúp đảm bảo tính nhất quán của dữ liệu (ACID) ngay cả khi có nhiều hành động đồng thời.
* **Giao diện Bảng Excel Spreadsheet cao cấp**:
  * Tích hợp tab **"Bảng Xếp Hạng Excel"** hiển thị danh sách người chơi xếp hạng từ cao xuống thấp (dựa trên `totalPoints`).
  * Các cột **Hạng**, **Thành viên**, **Tổng điểm** được thiết lập thuộc tính **Sticky CSS** giúp cố định cột khi cuộn ngang danh sách trận đấu.
  * Các cột trận đấu động tự động sinh ra và hiển thị chữ viết tắt tên hai đội bóng (ví dụ: `MU-AR`, `VN-TL`).
  * Trạng thái dự đoán hiển thị rõ màu sắc: Xanh lá (Đúng), Đỏ (Sai), Xanh dương (Đang chờ), Xám (Chưa đặt).
* **Cơ chế Bảo mật bài cược (Anti-Cheat)**:
  * Khi trận đấu chưa bị khóa cược, dự đoán của người chơi khác sẽ bị ẩn đi và hiển thị biểu tượng **Khóa 🔒** để chống tình trạng sao chép bài cược của những người đứng đầu bảng xếp hạng. Các lựa chọn chỉ được hiển thị khi trận đấu đã bị khóa cược hoặc đã diễn ra.

---

## 🌎 GIAI ĐOẠN 5: Đa Ngôn Ngữ, Đồng Banh Tự Động & Nâng Cấp Trực Quan (Session 2)
* **Đa Ngôn Ngữ (Multi-Language Support - VI/EN)**:
  * Xây dựng [LanguageContext.tsx](file:///e:/Ai%20dev%20github/football-predict/src/context/LanguageContext.tsx) lưu trữ ngôn ngữ ở LocalStorage và hỗ trợ dịch động toàn bộ giao diện ở các trang `Login`, `Home`, và `Admin`.
* **Dự Đoán Hòa Có Điều Kiện & Nhãn "Hòa Kèo"**:
  * Ẩn nút "Hòa" ở các trận đấu có chấp bóng khác 0; nút Hòa chỉ xuất hiện khi tỷ lệ chấp là 0 (đồng banh).
  * Hiển thị nhãn chấp 0 là "Hòa Kèo" (VI) / "Draw Refund" (EN) trên giao diện.
* **Cải Tiến Bảng Excel & Độ Tương Phản**:
  * Thay thế nhãn dự đoán "Đúng/Sai" trong bảng Excel thành "Thắng/Thua" (VI) hoặc "Win/Loss" (EN).
  * Tối ưu hóa màu xanh và đỏ đậm của các lớp `.cell-thang` và `.cell-thua` trong `index.css` để đảm bảo độ tương phản cao, dễ nhìn trên cả Dark và Light mode.
* **Tự Động Chuyển Trực Tiếp (Auto-Live Status)**:
  * Thêm logic kiểm tra định kỳ mỗi 5 giây trong [Admin.tsx](file:///e:/Ai%20dev%20github/football-predict/src/pages/Admin.tsx) để tự động chuyển đổi trạng thái trận đấu từ `scheduled` sang `live` khi `now >= matchTime`.
* **Khắc Phục Giao Diện Admin & Nút Nhập Liệu**:
  * Đồng bộ nền body và overlay mờ động theo theme để sửa lỗi chữ sáng đè lên nền sáng gây mờ/nhoè giao diện.
  * Tích hợp lớp `.admin-input` vào toàn bộ input, select, và modal của trang quản trị để hiển thị rõ ràng, sắc nét và cao cấp hơn.

---

## 🚀 GIAI ĐOẠN 6: Đẩy Code Lên GitHub & Triển Khai Môi Trường Sản Xuất Vercel (Session 3)
* **Đồng bộ mã nguồn lên GitHub**:
  * Chuyển đổi liên kết git remote từ GitLab cũ sang kho lưu trữ GitHub chính thức: [https://github.com/dedinhnguyen/football-predict.git](https://github.com/dedinhnguyen/football-predict.git).
  * Cập nhật thông tin Git Author cục bộ và đẩy toàn bộ lịch sử commit cùng trạng thái code hiện tại lên nhánh `main`.
* **Cấu hình môi trường Cloud trên Vercel**:
  * Liên kết thư mục cục bộ với dự án Vercel.
  * Thiết lập đầy đủ 6 biến môi trường cấu hình SDK Firebase Client (`VITE_FIREBASE_*`) từ `.env.local` lên bảng điều khiển Vercel cho cả môi trường Production và Preview.
  * Triển khai biên dịch và đóng gói hoàn tất. Dự án hoạt động chính thức tại tên miền: **[https://football-predict-lemon.vercel.app](https://football-predict-lemon.vercel.app)**.

---

## 📱 GIAI ĐOẠN 7: Tối ưu hóa Giao diện Thích ứng (Responsive Layout Optimization - Session 4)
* **Tối ưu hóa đa thiết bị (Mobile, Tablet, iPad)**:
  * Tinh chỉnh kích thước chữ, padding và khoảng cách của trang [Login.tsx](file:///e:/Ai%20dev%20github/football-predict/src/pages/Login.tsx) để đảm bảo vừa vặn trên các màn hình nhỏ mà không làm mất hiệu ứng Glassmorphism sang trọng.
  * Cải tiến Header trang [Home.tsx](file:///e:/Ai%20dev%20github/football-predict/src/pages/Home.tsx) và ẩn nhãn văn bản của nút đổi ngôn ngữ (`hidden sm:inline`) để tiết kiệm không gian trên di động.
  * Điều chỉnh định vị các cột cố định trong Bảng xếp hạng Excel: Cột Hạng và Thành viên được cấu hình lại thuộc tính `sticky` và `left` đồng bộ theo độ rộng của cột (`w-10 sm:w-12` tương ứng với `left-10 sm:left-12`) để tránh sự cố đè cột khi cuộn ngang.
  * Áp dụng các quy tắc thu gọn chiều rộng và cắt ngắn văn bản (`truncate`) có giới hạn (`max-w-[70px] sm:max-w-[110px]`) cho tên thành viên trên bảng.
  * Rút gọn giao diện bảng danh sách trận đấu và ẩn text của các nút điều khiển trạng thái trận đấu trên trang [Admin.tsx](file:///e:/Ai%20dev%20github/football-predict/src/pages/Admin.tsx), thay bằng hiển thị icon để tối đa hóa không gian trải nghiệm.

---

## 🛠️ Trạng thái biên dịch
* Lệnh build `npm run build` đã chạy thành công 100% không có lỗi trên cả máy cục bộ và máy chủ build của Vercel sau khi tích hợp toàn bộ các chỉnh sửa responsive.


