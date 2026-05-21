# Nhật Ký Phát Triển & Bản Thiết Kế Hệ Thống - SESSION 3 (GitHub Push & Vercel Deployment)

Tài liệu này tổng hợp toàn bộ các thay đổi kiến trúc, quy trình đẩy mã nguồn lên GitHub và triển khai lên môi trường sản xuất Vercel được thực hiện trong **Session 3**.

---

## 🏗️ Tổng Quan Thay Đổi Kiến Trúc & Logic Nghiệp Vụ

Trong Session 3, chúng ta tập trung vào việc đưa ứng dụng lên môi trường cloud và thiết lập quy trình CI/CD ban đầu:
1. **GitHub Synchronization**:
   - Chuyển đổi Remote Git từ GitLab cũ sang GitHub mới: `https://github.com/dedinhnguyen/football-predict.git`.
   - Cập nhật thông tin cục bộ của tác giả (author name và email) tương thích với lịch sử commit của dự án để đảm bảo tính đồng bộ và quản lý mã nguồn chuẩn chỉ.
   - Đẩy toàn bộ mã nguồn hiện tại lên nhánh `main` của repository GitHub.
2. **Vercel Cloud Deployment & Troubleshooting**:
   - Khởi tạo liên kết dự án cục bộ với nền tảng Vercel (`dinhde1221-8522s-projects/football-predict`).
   - **Xử lý sự cố thiếu biến môi trường**: Ban đầu lệnh nhập chuỗi biến môi trường trong PowerShell bị ngắt quãng dẫn đến thiếu các biến Firestore cốt lõi (`VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`), khiến ứng dụng gặp lỗi `Failed to get document because the client is offline`.
   - **Khắc phục**: Đã bổ sung đầy đủ cả 6 biến môi trường của Firebase Client SDK lên Vercel Production và tiến hành deploy lại dự án để Vite cập nhật cấu hình mới.
   - Triển khai thành công ứng dụng web lên máy chủ Vercel với tên miền chính thức: **[https://football-predict-lemon.vercel.app](https://football-predict-lemon.vercel.app)**.

---

## 🛠️ Danh Sách Các File Đã Được Tạo / Cập Nhật

### 1. [package.json](file:///e:/Ai%20dev%20github/football-predict/package.json) `[MODIFY]`
- Điều chỉnh lệnh chạy máy chủ cục bộ `"dev": "vite"` thay vì ràng buộc địa chỉ host cụ thể giúp quá trình chạy máy chủ cục bộ ở các môi trường mạng khác nhau được linh hoạt hơn.

### 2. [.vercel/project.json](file:///e:/Ai%20dev%20github/football-predict/.vercel/project.json) `[NEW]`
- Tệp cấu hình liên kết dự án cục bộ với ID dự án (`projectId`) và tổ chức (`orgId`) trên dịch vụ Vercel để hỗ trợ triển khai nhanh qua CLI không cần thông qua giao diện Web.

---

## 🔒 Quy Tắc Phân Quyền / Bảo Mật

- **Firebase SDK Security**: Toàn bộ các biến môi trường cấu hình Firebase SDK (`VITE_FIREBASE_*`) đã được chuyển lên nền tảng Vercel và được bảo mật an toàn dưới dạng các biến môi trường được mã hóa từ phía máy chủ Cloud, chỉ được đưa vào ứng dụng trong quá trình biên dịch sản phẩm (build time).
- **Vercel Deployment Protection**: Quá trình triển khai được liên kết trực tiếp với tài khoản cá nhân có thẩm quyền (`dinhde1221-8522`), ngăn chặn mọi hành vi thay đổi mã nguồn trái phép từ bên ngoài.

---

## 🚀 Định Hướng Phát Triển Tiếp Theo

1. **GitHub Actions / Vercel Integration**: Thiết lập liên kết tự động giữa GitHub và Vercel để mỗi khi người dùng push code lên GitHub nhánh `main`, Vercel sẽ tự động kích hoạt tiến trình Deploy (Auto Deploy) thay vì phải chạy deploy thủ công qua CLI.
2. **Firestore Security Rules Verification**: Tiếp tục hoàn thiện tệp `firestore.rules` trên môi trường thực tế để đảm bảo tính toàn vẹn dữ liệu cho các lượt cược và cập nhật điểm số.
