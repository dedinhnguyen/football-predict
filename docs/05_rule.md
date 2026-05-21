# Quy Tắc Đồng Bộ Tài Liệu Phát Triển (Documentation Sync Rules)

Để đảm bảo toàn bộ quy trình phát triển, các thay đổi kiến trúc và mã nguồn được theo dõi chính xác, Trợ lý AI (Antigravity) phải tuân thủ nghiêm ngặt quy tắc cập nhật tài liệu dưới đây sau mỗi lần có thay đổi hoặc kết thúc một phiên làm việc (Session).

---

## 📋 1. Các File Tài Liệu Cần Cập Nhật

Sau bất kỳ thay đổi nào về mã nguồn, cấu trúc dữ liệu, hoặc logic nghiệp vụ, trợ lý phải cập nhật song song 2 tài liệu sau nằm trong thư mục `docs/` của dự án:

1. **`docs/DOC_GENERATED/FULL_FLOW.md` (Tổng quan quy trình)**: 
   - Tài liệu này đóng vai trò là bức tranh toàn cảnh của dự án từ lúc khởi tạo đến hiện tại.
   - Khi có tính năng mới hoặc thay đổi lớn, cần bổ sung hoặc cập nhật các "Giai đoạn" (Phases/Giai đoạn 1, 2, 3, 4, 5...) để phản ánh đúng hiện trạng dự án.

2. **`docs/SESSIONS_PROJECT/SESSION_i.md` (Nhật ký chi tiết từng phiên - với `i` là số thứ tự phiên)**:
   - Mỗi phiên làm việc (Session) của người dùng sẽ có một file nhật ký riêng (ví dụ: `SESSION_1.md`, `SESSION_2.md`, ...).
   - Nếu người dùng chuyển sang một phiên làm việc mới (hoặc hỏi về các yêu cầu thuộc phiên làm việc mới), trợ lý cần tự động tạo file `SESSION_i.md` mới trong thư mục `docs/SESSIONS_PROJECT/` (với `i` tăng dần từ `1`).
   - File này ghi lại chi tiết các thay đổi kỹ thuật cụ thể của phiên đó.


---

## ✍️ 2. Cấu Trúc Nội Dung Cần Có

### A. Trong `docs/DOC_GENERATED/FULL_FLOW.md`
- Phân chia theo các **GIAI ĐOẠN** phát triển rõ ràng.
- Ghi nhận tóm tắt các tính năng chính đã triển khai trong giai đoạn đó.
- Cập nhật danh sách file đã thay đổi liên quan.
- Trạng thái biên dịch mới nhất (`npm run build`).

### B. Trong `docs/SESSIONS_PROJECT/SESSION_i.md`
- **Tiêu đề**: `# Nhật Ký Phát Triển & Bản Thiết Kế Hệ Thống - SESSION i`
- **Kiến Trúc & Thiết Kế**: Sơ đồ hoặc mô tả ngắn gọn về thay đổi kiến trúc trong Session này.
- **Cơ Sở Dữ Liệu**: Cấu trúc các bảng (Collections/Tables) được cập nhật hoặc tạo mới.
- **Danh Sách File Tạo Mới / Sửa Đổi**: Đường dẫn file cụ thể dạng markdown links (ví dụ: `[Home.tsx](file:///d:/Predict%20Football/src/pages/Home.tsx)` kèm nhãn `[NEW]` hoặc `[MODIFY]`).
- **Quy Tắc Phân Quyền / Bảo Mật**: Nếu có thay đổi về phân quyền người dùng hoặc Firestore Rules.
- **Định Hướng Tiếp Theo**: Các bước đề xuất tiếp theo cho dự án.


---

## ⚡ 3. Nguyên Tắc Cập Nhật Tự Động
- Không đợi người dùng nhắc nhở; trợ lý phải tự động cập nhật/tạo mới các file này ngay sau khi hoàn thành code và xác minh build thành công.
- Đảm bảo đường dẫn liên kết đến các file code là đường dẫn tuyệt đối chính xác sử dụng giao thức `file:///`.
