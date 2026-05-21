# Hướng Dẫn Cài Đặt Và Cấu Hình Hệ Thống (GUIDE)

Tài liệu này hướng dẫn chi tiết các bước cài đặt mã nguồn, cấu hình Firebase Authentication (đăng nhập bằng Google popup) và **Firebase Cloud Firestore** (lưu trữ cơ sở dữ liệu và đồng bộ realtime) cho dự án Predict Football. Dự án sử dụng mô hình **100% Firebase Architecture**.

---

## 📋 Yêu cầu hệ thống
* **Node.js**: Phiên bản 18.x trở lên.
* **NPM** hoặc **Yarn** / **PNPM**.

---

## 🚀 Bước 1: Cài đặt Dự án & Thư viện
1. Di chuyển vào thư mục dự án và cài đặt toàn bộ các dependencies cần thiết:
   ```bash
   npm install
   ```
2. Tạo tệp cấu hình môi trường `.env.local` ở thư mục gốc của dự án:
   ```env
   # Firebase Configuration Keys
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-sender-id
   VITE_FIREBASE_APP_ID=your-firebase-app-id
   ```
   *(Thay thế các giá trị trên bằng thông số thật lấy từ Firebase Console của bạn).*

---

## ⚡ Bước 2: Cấu hình trên Firebase Console

### 1. Kích hoạt Google Sign-In Provider (BẮT BUỘC)
Để cho phép người dùng đăng nhập bằng tài khoản Google:
1. Truy cập vào [Firebase Console](https://console.firebase.google.com/) và tạo một dự án mới (hoặc sử dụng dự án hiện tại).
2. Tại menu bên trái, chọn **Build** -> **Authentication** và nhấn **Get Started**.
3. Chuyển sang tab **Sign-in method**, chọn **Google** dưới danh sách nhà cung cấp bổ sung (Additional providers).
4. Nhấn **Enable**, điền thông tin email hỗ trợ của dự án, rồi nhấn **Save** để kích hoạt.
5. Tạo một Web App trong dự án Firebase của bạn để lấy các thông số cấu hình và điền vào các biến `VITE_FIREBASE_*` trong file `.env.local`.

### 2. Cấu hình Authorized Domains (Nếu chạy qua IP mạng nội bộ)
Mặc định Firebase chỉ cho phép đăng nhập từ `localhost`. Do bạn chạy dự án trên IP mạng nội bộ (ví dụ: `192.168.188.24`), bạn phải:
1. Vào **Firebase Console** -> Chọn dự án -> **Authentication** -> Chọn tab **Settings** ở trên.
2. Tìm mục **Authorized domains** (Miền được ủy quyền).
3. Bấm **Add domain** và điền IP của bạn (ví dụ: `192.168.188.24` - không cần `http://` hay cổng `:5173`).
4. Bấm **Add** để lưu lại. Nếu không cấu hình, Firebase Auth sẽ chặn và báo lỗi `auth/unauthorized-domain`.

### 3. Kích hoạt Cloud Firestore Database
Để lưu trữ dữ liệu trận đấu, dự đoán, cấu hình và người dùng:
1. Tại menu bên trái của Firebase Console, chọn **Build** -> **Firestore Database**.
2. Nhấp vào **Create database**.
3. Chọn vị trí lưu trữ database thích hợp (ví dụ: `asia-southeast1` cho Việt Nam) và nhấp **Next**.
4. Chọn bắt đầu ở **Start in test mode** để thuận tiện cho việc phát triển (sau này có thể viết Rules bảo mật chặt chẽ hơn). Nhấp **Create**.

---

## ⚡ Bước 3: Cấu hình Rules cho Firestore (Khuyến nghị)
Bạn có thể cập nhật rules cho Cloud Firestore tại tab **Rules** trên Firestore Console để bảo vệ dữ liệu:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cho phép đọc/ghi tất cả tài liệu nếu người dùng đã xác thực (đăng nhập)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📂 Bước 4: Các Collections chính trong Firestore
Cấu trúc cơ sở dữ liệu sẽ tự động được khởi tạo thông qua giao diện của ứng dụng khi thao tác. Firestore lưu dữ liệu dưới dạng:
1. **`users`**:
   - ID của document là UID của user từ Firebase Auth (ví dụ: `users/fUserUID`).
   - Fields: `uid`, `email`, `displayName`, `avatarUrl`, `role` (`'user'` hoặc `'admin'`), `totalPoints` (number).
2. **`matches`**:
   - ID của document được tạo ngẫu nhiên bởi Firestore.
   - Fields: `homeTeam` (object `{name, logoUrl}`), `awayTeam` (object `{name, logoUrl}`), `handicap` (number), `matchTime` (ISO string), `status` (`'scheduled'`, `'live'`, `'completed'`), `result` (object `{homeScore, awayScore, winningKeeo}` - chỉ có khi completed), `createdAt` (timestamp).
3. **`predictions`**:
   - ID của document được đặt theo định dạng dạng ghép `${userId}_${matchId}` để đảm bảo mỗi user chỉ có tối đa 1 document dự đoán cho mỗi trận đấu.
   - Fields: `userId`, `matchId`, `predictedChoice` (`'home'`, `'away'`, `'draw'`), `modificationCount` (number), `isLocked` (boolean), `isCorrect` (boolean | null), `createdAt` (timestamp), `updatedAt` (timestamp).
4. **`settings`**:
   - Document cố định tại đường dẫn `settings/app`.
   - Fields: `appTitle` (string), `defaultBgImage` (Base64 hoặc URL), `matchLockTimeMinutes` (number).

---

## 🔑 Bước 5: Thăng chức Quyền Quản trị viên (Admin Role)
Mặc định khi người dùng mới đăng ký vào hệ thống qua tài khoản Gmail, họ sẽ tự động được gán vai trò `user` (role: `'user'`). Để cấp quyền quản trị (Admin):
1. Truy cập [Firebase Console](https://console.firebase.google.com/) -> Chọn dự án -> **Firestore Database**.
2. Chọn collection **`users`**.
3. Tìm document tương ứng với ID người dùng cần phân quyền (đối chiếu qua trường `email`).
4. Kích đúp vào trường **`role`**, đổi giá trị từ `'user'` thành `'admin'`.
5. Nhấn **Save** để áp dụng. Người dùng đó tải lại trang web là sẽ có menu Admin và truy cập được vào trang quản lý.

---

## 💻 Bước 6: Chạy dự án ở máy cục bộ
1. Khởi chạy máy chủ phát triển (Development Server):
   ```bash
   npm run dev
   ```
   Mở trình duyệt truy cập địa chỉ mặc định hiển thị trên terminal (ví dụ: `http://localhost:5173` hoặc IP mạng nội bộ của bạn).

2. Biên dịch đóng gói sản phẩm cho môi trường sản xuất (Production Build):
   ```bash
   npm run build
   ```
   Mã nguồn đã biên dịch tối ưu sẽ được lưu trữ trong thư mục `/dist` sẵn sàng deploy lên các dịch vụ hosting như Vercel, Netlify hoặc Firebase Hosting.
