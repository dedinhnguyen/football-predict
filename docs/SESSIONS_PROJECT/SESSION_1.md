# Nhật Ký Phát Triển & Bản Thiết Kế Hệ Thống - SESSION 1 (100% Firebase)

Tài liệu này tổng hợp toàn bộ các thay đổi kiến trúc, dịch vụ và logic nghiệp vụ được thực hiện trong **Session 1** nhằm mục đích thiết lập hệ thống xác thực người dùng qua **Firebase Authentication (Google Sign-In popup)** và lưu trữ cơ sở dữ liệu trên **Firebase Cloud Firestore**.

---

## 🏗️ Tổng Quan Kiến Trúc 100% Firebase

Sử dụng hoàn toàn Firebase mang lại những ưu điểm vượt trội cho dự án Predict Football:
* **Xác thực nhanh chóng (Firebase Auth - Google Popup flow)**: Xác thực trực tiếp qua Google Accounts, tự động lấy avatar và thông tin người dùng.
* **Thời gian thực (Real-time Cloud Firestore)**: Tận dụng cơ chế `onSnapshot` mạnh mẽ của Firestore giúp đồng bộ dữ liệu tức thời và liên tục mà không cần reload trang.
* **Firestore Transactions (`runTransaction`)**: Xử lý logic nghiệp vụ nhạy cảm (cộng điểm, cập nhật trạng thái cược và trận đấu) một cách nguyên tử trực tiếp từ phía client nhưng vẫn bảo toàn tính nhất quán (ACID), không bị xung đột dữ liệu.

```
                    ┌────────────────────────┐
                    │      Client App        │
                    │  (React Vite TS + CSS) │
                    └───────────┬────────────┘
                                │
                      (Auth & Real-time DB)
                                ▼
                    ┌────────────────────────┐
                    │     Firebase Suite     │
                    │ (Authentication & DB)  │
                    └────────────────────────┘
```

---

## 🗃️ Cấu Trúc Cơ Sở Dữ Liệu (Firestore Collections)

Khi chạy mã nguồn này ở máy khác, bạn chỉ cần kích hoạt **Firestore Database** trên Firebase Console và cấu trúc sẽ được tự động khởi tạo khi người dùng đăng nhập hoặc Admin thao tác.

### 1. Collection `users`
* ID document: `uid` của user từ Firebase Auth.
* Các trường (Fields):
  * `uid`: string (Khớp với Firebase Auth User ID)
  * `email`: string
  * `displayName`: string
  * `avatarUrl`: string
  * `role`: string (`'user'` hoặc `'admin'`, mặc định là `'user'`)
  * `totalPoints`: number (Tổng điểm tích lũy của user, mặc định `0`)
  * `createdAt`: timestamp

### 2. Collection `matches`
* ID document: Ngẫu nhiên (Firestore Auto-ID).
* Các trường (Fields):
  * `homeTeam`: object `{ name: string, logoUrl: string }`
  * `awayTeam`: object `{ name: string, logoUrl: string }`
  * `handicap`: number (Kèo chấp bóng, ví dụ `0.5`, `1`, `1.5`)
  * `matchTime`: string (ISO Date string đại diện cho thời gian thi đấu)
  * `status`: string (`'scheduled'`, `'live'`, hoặc `'completed'`)
  * `result`: object `{ homeScore: number, awayScore: number, winningKeeo: 'home'|'away'|'draw' }` (Chỉ xuất hiện khi trận đấu kết thúc)
  * `createdAt`: timestamp

### 3. Collection `predictions`
* ID document: Ghép theo dạng `${userId}_${matchId}` để đảm bảo tính duy nhất (mỗi người chơi chỉ đoán tối đa 1 lựa chọn cho mỗi trận đấu).
* Các trường (Fields):
  * `userId`: string
  * `matchId`: string
  * `predictedChoice`: string (`'home'`, `'away'`, hoặc `'draw'`)
  * `modificationCount`: number (Số lần sửa cược, tối đa `2`)
  * `isLocked`: boolean (Đã khóa cược hay chưa)
  * `isCorrect`: boolean | null (`null` nếu chưa có kết quả, `true` nếu đoán trúng kèo, `false` nếu thua kèo)
  * `createdAt`: timestamp
  * `updatedAt`: timestamp

### 4. Collection `settings`
* Tài liệu cấu hình cố định tại đường dẫn: `settings/app`
* Các trường (Fields):
  * `appTitle`: string (Tiêu đề web động)
  * `defaultBgImage`: string (Base64 hoặc URL ảnh nền)
  * `matchLockTimeMinutes`: number (Số phút khóa cược trước trận đấu, mặc định `15`)

---

## 🛠️ Danh Sách Các File Đã Được Tạo / Cập Nhật

### 1. [firebase.ts](file:///d:/Predict%20Football/src/lib/firebase.ts) `[MODIFY]`
* Thiết lập kết nối client với dự án Firebase bằng thư viện `firebase/app`, `firebase/auth` và `firebase/firestore`. Export đối tượng `db` đại diện cho Firestore.

### 2. [AuthContext.tsx](file:///d:/Predict%20Football/src/context/AuthContext.tsx) `[MODIFY]`
* Sử dụng `onAuthStateChanged` từ Firebase Auth để lắng nghe trạng thái đăng nhập.
* Khi đăng nhập thành công:
  * Kiểm tra và tự động khởi tạo profile user trong collection `users` trên Firestore nếu là tài khoản mới đăng nhập lần đầu.
  * Thiết lập listener `onSnapshot` để đồng bộ điểm số (`totalPoints`) và quyền hạn (`role`) thời gian thực của user.

### 3. [settingsService.ts](file:///d:/Predict%20Football/src/lib/services/settingsService.ts) `[MODIFY]`
* Sử dụng Firestore API (`getDoc`, `setDoc`, `updateDoc`) để đọc và lưu cấu hình ứng dụng động tại document `settings/app`.

### 4. [matchService.ts](file:///d:/Predict%20Football/src/lib/services/matchService.ts) `[MODIFY]`
* Sử dụng Firestore để thực hiện CRUD trận đấu.
* Xây dựng hàm `updateMatchStatus` sử dụng **Firestore Transaction (`runTransaction`)** để tính toán cộng điểm tích lũy an toàn cho người dùng dự đoán chính xác khi trận đấu chuyển sang `'completed'`.

### 5. [predictionService.ts](file:///d:/Predict%20Football/src/lib/services/predictionService.ts) `[MODIFY]`
* Thực hiện gửi cược vào collection `predictions`. Tích hợp logic giới hạn 2 lần sửa đổi (`modificationCount < 2`) và kiểm tra khóa cược theo thời gian trận đấu.

### 6. [Home.tsx](file:///d:/Predict%20Football/src/pages/Home.tsx) & [Admin.tsx](file:///d:/Predict%20Football/src/pages/Admin.tsx) `[MODIFY]`
* Loại bỏ hoàn toàn kết nối Supabase Client.
* Chuyển đổi toàn bộ các useEffect lấy dữ liệu và lắng nghe realtime sang sử dụng hàm `onSnapshot` của Firestore giúp giao diện luôn cập nhật tức thì.

### 7. [package.json](file:///d:/Predict%20Football/package.json) `[MODIFY]`
* Thêm gói thư viện `"firebase": "^10.12.2"` và gỡ bỏ hoàn toàn gói `"@supabase/supabase-js"`.

---

## 🔒 Quy Tắc Phân Quyền (Authorization)

1. **Quyền Thành Viên Mặc Định (role: 'user')**:
   - Khi đăng nhập lần đầu tiên qua tài khoản Google OAuth, logic trong `AuthContext.tsx` sẽ chèn bản ghi mới vào Firestore với `role: 'user'`.
2. **Quyền Quản Trị Viên (role: 'admin')**:
   - Hệ thống không cung cấp giao diện tự thay đổi quyền hạn ở phía client để tránh lỗ hổng bảo mật.
   - Để nâng quyền Admin cho tài khoản của bạn: Truy cập vào **Firebase Console** -> **Firestore Database** -> Chọn collection `users` -> Tìm document tương ứng với email của bạn và sửa đổi trường `role` thành `'admin'`.

---

## 🚀 Định Hướng Phát Triển Tính Năng Mới (Scale & Future Features)

1. **Bảo Mật Bằng Cloud Firestore Security Rules**:
   - Thiết lập cấu hình bảo mật Rules trên Firebase Console để bảo vệ dữ liệu nhạy cảm (ví dụ: chỉ cho phép user sửa dự đoán của chính mình khi chưa bị khóa, và cấm user sửa đổi trường `totalPoints` hay `role` trực tiếp từ client).
2. **Tải Lên Danh Sách Trận Đấu Bằng Tệp Excel/CSV**:
   - Phân tích tệp Excel phía client để import hàng loạt trận đấu vào Firestore một cách nhanh chóng.
3. **Đẩy Thông Báo Nhắc Nhở Bằng Firebase Cloud Messaging (FCM)**:
   - Tích hợp FCM để gửi thông báo đẩy đến trình duyệt của người dùng trước giờ khóa cược 30 phút để nhắc nhở họ đặt cược.
