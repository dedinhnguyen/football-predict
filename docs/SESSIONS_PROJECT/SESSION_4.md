# Nhật Ký Phát Triển & Bản Thiết Kế Hệ Thống - SESSION 4 (Hướng Dẫn Người Dùng & Chế Độ Khách - Guest Mode)

Tài liệu này tổng hợp toàn bộ các thay đổi kiến trúc, quy tắc bảo mật dữ liệu, giao diện người dùng và sửa lỗi phân quyền khi đăng nhập/đăng xuất được thực hiện trong **Session 4**.

---

## 🏗️ Tổng Quan Thay Đổi Kiến Trúc & Tính Năng Mới

Trong Session 4, hệ thống tập trung nâng cao trải nghiệm người dùng mới thông qua tour hướng dẫn tương tác và mở rộng khả năng tiếp cận bằng chế độ Khách (Guest Mode) không cần đăng nhập:

1. **Tour Hướng Dẫn Tương Tác Người Dùng (Driver.js Tour)**:
   - Tích hợp thư viện `driver.js` để xây dựng chuỗi hướng dẫn từng bước (10 bước) giúp người mới làm quen với các khu vực chính của ứng dụng: Logo, Warning Banner, Điểm số, Tab dự đoán, Trận đấu mẫu, Bộ đếm lượt sửa cược, Tab bảng xếp hạng Excel, Cột bảng xếp hạng và nút kích hoạt thủ công.
   - Xây dựng hook custom [useAppTour.ts](file:///d:/Predict%20Football/src/hooks/useAppTour.ts) để quản lý luồng chạy tour, tự động chuyển đổi ViewMode (`predict` <-> `leaderboard`) tương ứng với đối tượng đang được giới thiệu.
   - Tự động chạy tour trong lần đầu tiên người dùng đăng nhập hợp lệ và hiển thị giao diện chính. Cho phép chạy lại thủ công qua nút Hỏi đáp ở Header.
   - Đồng bộ hóa phong cách Glassmorphism của Tour popover trong file CSS [index.css](file:///d:/Predict%20Football/src/index.css).

2. **Chế Độ Xem Với Vai Trò Khách (Guest Mode)**:
   - Thêm tùy chọn "Xem với vai trò Khách" (Continue as Guest) tại màn hình [Login.tsx](file:///d:/Predict%20Football/src/pages/Login.tsx) thông qua một nút dạng Glassmorphic tinh tế.
   - Triển khai Quản lý phiên khách ảo trong [AuthContext.tsx](file:///d:/Predict%20Football/src/context/AuthContext.tsx) bằng `sessionStorage` (`is_guest = 'true'`).
   - Tài khoản Khách ảo sẽ có: `uid: 'guest'`, tên hiển thị là "Khách" hoặc "Guest" tùy theo ngôn ngữ hiện tại, avatar robot tự động từ Dicebear, vai trò `'user'`, và `totalPoints: 0`.
   - Bảo vệ giao diện Sàn Dự Đoán: Khóa tương tác (`disabled`, giảm opacity xuống `40%`, con trỏ `not-allowed`) đối với các nút dự đoán trận đấu để Khách không thể nhấp cược. Ẩn hoàn toàn bộ đếm lượt sửa đổi cược của trận đấu.
   - Hiển thị banner cảnh báo màu vàng tại trang chủ yêu cầu đăng nhập nếu người dùng đang ở vai trò Khách.
   - Hiển thị nút "Đăng nhập" (Sign In) nổi bật màu xanh dương tại Header thay thế cho nút Logout để người chơi dễ dàng liên kết tài khoản Google thực sự bất kỳ lúc nào.

3. **Sửa Lỗi Phân Quyền Firestore Khi Đăng Nhập & Chuyển Đổi Trạng Thái**:
   - **Hiện tượng**: Khi Khách nhấp vào nút "Đăng nhập" ở Header (gọi hàm `logout()` giải phóng session khách ảo và gọi `signOut(auth)` của Firebase), hệ thống ném ra lỗi `FirebaseError: Missing or insufficient permissions` tại listener người dùng trực tuyến.
   - **Nguyên nhân**: Khi Auth state chuyển dịch về `null` trước khi trang `Home` hoàn thành unmount, các listener realtime Firestore vẫn đang active (do dependency array là `[]` hoặc `[viewMode]` không phụ thuộc vào `user`) dẫn tới việc Firestore tự động đánh giá lại quyền với Token rỗng và bị từ chối bởi Firebase Security Rules.
   - **Cách xử lý**:
     - Cập nhật dependency array của các hook `useEffect` thiết lập `onSnapshot` trong [Home.tsx](file:///d:/Predict%20Football/src/pages/Home.tsx) để phụ thuộc vào `user`.
     - Thêm điều kiện dừng `if (!user) return;` ở đầu các hiệu ứng lắng nghe để hủy đăng ký subscription cũ khi user đăng xuất.
     - Lọc bỏ và in ra cảnh báo mang tính hướng dẫn (`console.warn`) giải thích rõ lỗi `'permission-denied'` và nhắc nhở lập trình viên cập nhật, triển khai rules mới. Điều này giúp gỡ lỗi dễ dàng nếu người dùng chưa cập nhật rules trên Cloud Firestore Console.
     - Thay đổi quy tắc trong [firestore.rules](file:///d:/Predict%20Football/firestore.rules) cho phép đọc công khai dữ liệu (`allow read: if true;`) đối với các bảng `users`, `matches`, `predictions`, và `settings` để khách có thể xem bảng xếp hạng và trận đấu một cách hợp lệ, đồng thời bảo vệ nghiêm ngặt quyền ghi (`allow write: if request.auth != null && ...`). Để thay đổi này có hiệu lực trên môi trường đám mây thực tế, lập trình viên cần triển khai (deploy) tệp quy tắc này lên Firebase Console.

---

## 🛠️ Danh Sách Các File Đã Được Tạo / Cập Nhật

### 1. [firestore.rules](file:///d:/Predict%20Football/firestore.rules) `[MODIFY]`
- Thay đổi điều kiện đọc dữ liệu từ `allow read: if request.auth != null;` sang `allow read: if true;` đối với toàn bộ các collections (`users`, `matches`, `predictions`, `settings`).
- Giữ nguyên các quy tắc ghi dữ liệu chặt chẽ để chống gian lận.

### 2. [Home.tsx](file:///d:/Predict%20Football/src/pages/Home.tsx) `[MODIFY]`
- Bổ sung `user` vào dependency array của tất cả bộ lắng nghe realtime (settings, matches, users, all predictions) để kích hoạt cơ chế dọn dẹp (cleanup unsubscribe) khi người dùng thay đổi trạng thái đăng nhập.
- Thêm kiểm tra `if (!user) return;` ở đầu mỗi listener.
- Chặn ghi log console các lỗi có mã `'permission-denied'` trong `onSnapshot`.
- Ẩn/Hiện các chức năng đặt cược, bộ đếm số lần sửa cược, header profile và nút đăng nhập tương ứng cho Khách ảo.

### 3. [AuthContext.tsx](file:///d:/Predict%20Football/src/context/AuthContext.tsx) `[MODIFY]`
- Khai báo thêm hàm `continueAsGuest` thiết lập trạng thái phiên ảo khách vào `sessionStorage`.
- Tự động duy trì trạng thái Khách ảo khi tải lại trang nếu cờ `is_guest` tồn tại.
- Đồng bộ dọn dẹp cờ phiên ảo khách khi gọi `logout()`.

### 4. [LanguageContext.tsx](file:///d:/Predict%20Football/src/context/LanguageContext.tsx) `[MODIFY]`
- Thêm các nhãn dịch tiếng Việt và tiếng Anh phục vụ cho giao diện Khách:
  - `loginGuestBtn` ("Xem với vai trò Khách" / "Continue as Guest")
  - `loginRequireAlert` ("Vui lòng đăng nhập tài khoản Google để thực hiện dự đoán!" / "Please log in with Google to submit predictions!")
  - `signInBtn` ("Đăng nhập" / "Sign In")
  - `or` ("Hoặc" / "Or")

### 5. [Login.tsx](file:///d:/Predict%20Football/src/pages/Login.tsx) `[MODIFY]`
- Tích hợp nút "Xem với vai trò Khách" với biểu tượng `User` của `lucide-react`.

### 6. [useAppTour.ts](file:///d:/Predict%20Football/src/hooks/useAppTour.ts) `[NEW]`
- Hook quản lý thư viện `driver.js` để thực hiện tour hướng dẫn tương tác 10 bước cho thành viên mới.

### 7. [index.css](file:///d:/Predict%20Football/src/index.css) `[MODIFY]`
- Thêm lớp CSS tùy chỉnh `.glass-driver-popover` và `.driver-popover-arrow` để làm đẹp popover của `driver.js` theo phong cách Dark Glassmorphism chung của toàn bộ trang web.

---

## 🚀 Định Hướng Phát Triển Tiếp Theo

1. **Lazy Loading Các Component Nặng**:
   - Thực hiện code-splitting đối với trang Admin và trang Leaderboard để tối ưu hóa kích thước bundle tải lần đầu cho người dùng thông thường và Guest.
2. **Hệ Thống Lưu Lịch Sử Dự Đoán Offline**:
   - Cho phép người chơi Khách lưu trữ tạm thời các dự đoán cược nháp vào `localStorage` của trình duyệt, hiển thị nút "Đồng bộ" để tự động gửi các cược nháp này lên Firestore ngay sau khi họ quyết định Đăng nhập bằng Google.
