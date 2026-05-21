# Implementation Plan - Phân đoạn triển khai Project

## Giai đoạn 1: Khởi tạo Project & Cấu hình Auth (Mục tiêu: Đăng nhập được)
- [ ] Khởi tạo dự án Next.js với Tailwind CSS.
- [ ] Cấu hình cơ sở dữ liệu (Prisma/Mongoose Models).
- [ ] Tích hợp NextAuth.js với Google Login. Tạo middleware chặn các trang nếu chưa login.

## Giai đoạn 2: Xây dựng Dashboard cho Admin (Mục tiêu: Có dữ liệu để test)
- [ ] Tạo giao diện `/admin` bảo mật.
- [ ] Viết chức năng CRUD Trận đấu (Thêm trận đấu, chọn logo, tỷ lệ chấp, set ngày giờ).
- [ ] Xây dựng nút cập nhật trạng thái (`scheduled` -> `live` -> `completed`).

## Giai đoạn 3: Phát triển Trang chủ User (Mục tiêu: Đặt cược và khóa form)
- [ ] Render Section 1: 8 trận gần nhất.
- [ ] Render Section 2: Form dự đoán cho trận sắp diễn ra.
- [ ] Viết logic Backend chặn lưu dự đoán nếu đã sửa quá 1 lần (Check `modificationCount == 2`) hoặc quá giờ thi đấu.

## Giai đoạn 4: Thiết kế Bảng Excel & Hệ thống Trả điểm tự động
- [ ] Dùng TanStack Table dựng Section 3: Bảng kết quả tổng hợp.
- [ ] Hiện thực hóa tính năng Cố định cột (STT, Tên, Điểm) và cuộn ngang.
- [ ] Viết hàm tự động cập nhật màu sắc Xanh/Đỏ và cộng điểm khi Admin bấm kết thúc trận đấu.
- [ ] Tối ưu hóa UI/UX: Hiển thị hiệu ứng loading mượt mà.