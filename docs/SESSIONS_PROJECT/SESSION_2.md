# Nhật Ký Phát Triển & Bản Thiết Kế Hệ Thống - SESSION 2 (Đa Ngôn Ngữ, Trực Tiếp Tự Động & Contrast)

Tài liệu này tổng hợp toàn bộ các thay đổi kiến trúc, dịch vụ và logic nghiệp vụ được thực hiện trong **Session 2** nhằm hoàn thiện trải nghiệm đa ngôn ngữ (VI/EN), tự động hóa luồng trận đấu, điều chỉnh luật kèo cược đồng banh và tối ưu giao diện Admin.

---

## 🏗️ Tổng Quan Thay Đổi Kiến Trúc & Logic Nghiệp Vụ

Trong Session 2, hệ thống đã mở rộng thêm các lớp quản lý giao diện và nghiệp vụ tự động:
1. **Quản lý Đa Ngôn Ngữ (Language Provider)**: 
   - Tích hợp `LanguageContext` để quản lý việc dịch thuật trực tiếp từ phía client (hệ thống lưu trạng thái ngôn ngữ vào LocalStorage của trình duyệt).
   - Tự động thay đổi ngôn ngữ trên toàn bộ giao diện mà không cần reload trang.
2. **Kèo Chấp Đồng Banh (Chấp 0)**:
   - Sàn dự đoán được thay đổi linh hoạt: Chỉ hiển thị nút **Hòa** khi tỉ lệ chấp bằng `0`. Với bất kỳ tỉ lệ chấp nào khác, nút Hòa sẽ biến mất để tránh nhập nhèm cược.
   - Nhãn hiển thị tỷ lệ chấp `Chấp 0` được cập nhật thành cụm từ thân thiện: `"Hòa Kèo"` (Tiếng Việt) / `"Draw Refund"` (Tiếng Anh).
3. **Tự Động Hóa Chuyển Đổi Live (Auto-Live Flow)**:
   - Trang Danh sách Trận đấu phía Admin được tích hợp bộ đếm thời gian (interval 5 giây) để tự động hóa việc đưa trận đấu lên sóng trực tiếp khi đến giờ mà không cần Admin nhấn nút thủ công.
4. **Nâng Cao Độ Tương Phản Màu & Giao Diện Sáng/Tối (Contrast & Themes)**:
   - Bản xếp hạng Excel thay thế các nhãn `"Đúng/Sai"` thành `"Thắng/Thua"` (hoặc `"Win/Loss"`).
   - Các ô màu trong bảng được nâng cao độ tương phản màu nền và màu chữ để nổi bật hơn.
   - Sửa lỗi body background overlay và thêm lớp `.admin-input` giúp các trường nhập liệu trong trang Admin hiển thị rõ nét, sắc sảo.

---

## 🛠️ Danh Sách Các File Đã Được Tạo / Cập Nhật

### 1. [LanguageContext.tsx](file:///d:/Predict%20Football/src/context/LanguageContext.tsx) `[NEW]`
- Khởi tạo ngữ cảnh đa ngôn ngữ cho toàn bộ ứng dụng. Định nghĩa các nhãn dịch thuật (translations) cho cả tiếng Việt (VI) và tiếng Anh (EN).
- Hỗ trợ các hook dịch thuật `t(key)` và thay đổi ngôn ngữ `toggleLanguage`.

### 2. [index.css](file:///d:/Predict%20Football/src/index.css) `[MODIFY]`
- Thêm các lớp tương phản màu sắc cao cho các ô kết quả thắng/thua trong Excel: `.cell-thang`, `.cell-thua`.
- Định nghĩa lớp `.admin-input` với màu nền đặc và viền sắc nét, tương thích hoàn hảo cho cả chế độ sáng (đại diện bởi class `.light` ở root) và chế độ tối.
- Thêm lớp ghi đè màu huy hiệu khi chuyển đổi sang Light mode (`.light .text-red-400` và `.light .text-emerald-400`).

### 3. [Admin.tsx](file:///d:/Predict%20Football/src/pages/Admin.tsx) `[MODIFY]`
- **Auto-Live**: Thêm `useEffect` chạy định kỳ 5 giây để kiểm tra và tự động cập nhật trạng thái các trận đấu sang `'live'`.
- **Đồng bộ theme**: Thêm `useEffect` đồng bộ nền body và overlay gradient giúp giao diện không bị mờ nhòe khi chuyển đổi theme.
- **Trường nhập liệu**: Tích hợp lớp `.admin-input` cho toàn bộ thẻ `input`, `select`, `textarea` và các hộp nhập điểm trong Modal.
- **Đa ngôn ngữ**: Bản địa hóa toàn bộ trang Admin theo ngôn ngữ được chọn.

### 4. [Home.tsx](file:///d:/Predict%20Football/src/pages/Home.tsx) `[MODIFY]`
- Bản địa hóa toàn bộ giao diện sàn dự đoán, bảng xếp hạng và các nút tương tác.
- Tích hợp nút dự đoán **Hòa** có điều kiện (chỉ hiện khi `handicap === 0`).
- Cập nhật nhãn hiển thị chấp 0 thành nhãn `"Hòa Kèo"` / `"Draw Refund"`.
- Cập nhật bảng xếp hạng Excel sử dụng `"Thắng"/"Thua"` thay cho `"Đúng"/"Sai"`.

### 5. [Login.tsx](file:///d:/Predict%20Football/src/pages/Login.tsx) `[MODIFY]`
- Tích hợp dịch thuật đa ngôn ngữ cho toàn bộ văn bản đăng nhập và nút chọn ngôn ngữ (VI/EN).

### 6. [App.tsx](file:///d:/Predict%20Football/src/App.tsx) `[MODIFY]`
- Wrap ứng dụng bằng `LanguageProvider` để kích hoạt đa ngôn ngữ toàn hệ thống.

### 7. [05_rule.md](file:///d:/Predict%20Football/docs/05_rule.md) `[NEW]`
- Thiết lập quy tắc bắt buộc tự động cập nhật nhật ký phát triển `FULL_FLOW.md` và `SESSION_i.md` sau mỗi thay đổi mã nguồn.

---

## 🚀 Định Hướng Phát Triển Tiếp Theo

1. **Firestore Security Rules**: Xây dựng bộ quy tắc bảo mật để đảm bảo phân quyền ghi dữ liệu an toàn trên Firestore cho user và admin.
2. **Cải tiến hiển thị Realtime**: Tối ưu hiệu năng render danh sách cược khi số lượng trận đấu tăng cao.
