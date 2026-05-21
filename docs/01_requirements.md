# Software Requirements Specification (SRS) - Football Prediction Web App

## 1. Tổng quan hệ thống
Ứng dụng Single-Page cho phép người dùng đăng nhập qua Google để tham gia dự đoán tỉ số/kèo chấp của các trận đấu bóng đá, xem kết quả lịch sử và theo dõi bảng xếp hạng dạng Excel thời gian thực. Admin có quyền quản lý cấu trúc giải đấu, cập nhật kết quả và cấu hình giao diện.

## 2. Tính năng phía Người dùng (User End)
### 2.1 Authentication
- Đăng nhập, đăng xuất bằng tài khoản Google (Gmail OAuth2).
- Bảo mật Session: Chỉ user đã login mới được xem nội dung và dự đoán.

### 2.2 Trang chủ (Single-Page Layout)
Giao diện cuộn mượt gồm 3 Section chính theo thứ tự từ trên xuống:
- **Section 1: Lịch sử & Phong độ (Match History)**
  - Hiển thị tối đa 8 trận đấu gần nhất đã có kết quả chung cuộc (`completed`).
  - Thể hiện rõ thông tin trận đấu và trạng thái dự đoán của riêng user đó (Thắng/Thua).
- **Section 2: Sàn Dự Đoán (Prediction Board)**
  - Hiển thị các trận đấu kế tiếp (`scheduled`).
  - Mỗi trận gồm: Logo + tên 2 đội, ngày giờ thi đấu, tỷ lệ chấp (0, 0.5, 1, 1.5, 2 bàn).
  - Khóa dự đoán tự động: Hệ thống tự động khóa dự đoán trước khi trận đấu bắt đầu 15 phút, hoặc khi Admin chuyển trạng thái trận sang `live`.
  - **Logic giới hạn sửa đổi:** Sau lần Submit đầu tiên, form sẽ disable kết quả. Hiện nút "Dự đoán lại" (Chỉ cho phép sửa duy nhất 1 lần). Sau lần thứ 2, form khóa cứng vĩnh viễn. Có badge hiển thị số lượt sửa còn lại (1 hoặc 0).
- **Section 3: Bảng kết quả tổng hợp (Leaderboard Excel)**
  - Giao diện bảng (Table) mô phỏng Microsoft Excel.
  - **Tính năng UX bắt buộc:** Cố định 3 cột đầu (STT, Họ & Tên, Tổng điểm). Cuộn ngang (Horizontal scroll) để xem các cột trận đấu.
  - Tự động sắp xếp (Sort) danh sách User theo thứ tự "Tổng điểm" giảm dần.
  - Các cột trận đấu hiển thị Lựa chọn của user. Khi trận đấu `completed`: Ô đổi màu Xanh lá (Nếu đoán đúng, +1 điểm) hoặc màu Đỏ (Nếu đoán sai, 0 điểm).

## 3. Tính năng phía Quản trị (Admin Dashboard)
Tách biệt route bảo mật (`/admin`).
- **Quản lý Cấu hình giao diện:** Thay đổi ảnh nền (Background), Upload/Thay đổi Logo các đội bóng.
- **Quản lý Trận đấu (Match CRUD):**
  - Thêm trận đấu mới: Nhập tên 2 đội, upload logo, set ngày giờ, chọn tỷ lệ chấp.
  - Khi thêm 1 trận đấu mới, hệ thống phải tự động sinh ra một cột mới tương ứng trên Bảng kết quả Excel của User.
  - Cập nhật trạng thái trận đấu theo vòng đời: `scheduled` -> `live` -> `completed`.
  - Khi cập nhật trận đấu sang `completed`, admin nhập Tỷ số thực tế và Chọn đội thắng kèo. Hệ thống tự động kích hoạt tiến trình quét dữ liệu (Trigger background job) để tính toán điểm số và cập nhật màu sắc bảng Excel cho toàn bộ User.
- **Quản lý User Dự Đoán:** Quyền CRUD (Thêm, Sửa, Xóa) các bản ghi dự đoán của user nếu có sự cố khiếu nại.