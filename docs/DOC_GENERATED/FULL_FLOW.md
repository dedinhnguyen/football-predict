# Quy Trình Triển Khai Chi Tiết (FULL FLOW)

Tài liệu này tổng hợp toàn bộ các giai đoạn phát triển và logic nghiệp vụ đã được triển khai hoàn tất cho ứng dụng **Quản lý Dự Đoán Tỉ Số Bóng Đá** (React + Firebase Auth + Firebase Cloud Firestore - 100% Firebase Architecture).

---

## ⚽ GIAI ĐOẠN 1: Khởi tạo Project & Quản lý Đăng nhập (Auth Flow)
* **Khởi tạo môi trường**:
  * Dự án được thiết lập sử dụng **React + Vite + TypeScript**.
  * Cài đặt và cấu hình **Tailwind CSS v4** với thiết kế Glassmorphic cao cấp (Dark Mode mặc định, sử dụng phông chữ Inter và các bóng đổ hiệu ứng chiều sâu).
* **Quản lý trạng thái Auth (Firebase Authentication & Cloud Firestore)**:
  * Tích hợp SDK Firebase (`firebase`) để xử lý cả phần Xác thực (Auth) và Lưu trữ cơ sở dữ liệu (Firestore).
  * Khởi tạo file cấu hình kết nối [firebase.ts](file:///d:/Predict%20Football/src/lib/firebase.ts) lấy biến môi trường từ tệp `.env.local`.
  * Xây dựng [AuthContext.tsx](file:///d:/Predict%20Football/src/context/AuthContext.tsx) quản lý trạng thái đăng nhập thời gian thực thông qua Firebase `onAuthStateChanged`.
  * Tự động đồng bộ và khởi tạo hồ sơ người dùng trong collection `users` trên Firestore ngay trong lần đầu đăng nhập bằng **Google Account** (Sử dụng Popup đăng nhập `signInWithPopup` của Firebase Auth).
  * Lắng nghe cập nhật thông tin cá nhân của người dùng real-time từ collection `users` của Firestore qua hàm `onSnapshot` để đồng bộ điểm số và quyền admin tức thì.
  * Xây dựng Component [ProtectedRoute.tsx](file:///d:/Predict%20Football/src/components/ProtectedRoute.tsx) để bảo vệ các tuyến đường yêu cầu xác thực người dùng và phân quyền quản trị viên (Admin).

---

## 🛠️ GIAI ĐOẠN 2: Dashboard cho Quản trị viên (Admin Dashboard)
* **Xây dựng các Service tương tác Firestore**:
  * [firebase.ts](file:///d:/Predict%20Football/src/lib/firebase.ts): Khởi tạo Firestore db sử dụng `getFirestore`.
  * [matchService.ts](file:///d:/Predict%20Football/src/lib/services/matchService.ts): Xử lý CRUD trận đấu trong collection `matches` (`createMatch`, `deleteMatch`, `updateMatchStatus`).
  * [settingsService.ts](file:///d:/Predict%20Football/src/lib/services/settingsService.ts): Quản lý cấu hình tiêu đề trang và ảnh nền chung của ứng dụng từ document `settings/app`.
* **Phân quyền người dùng & Bảo mật vai trò**:
  * Mặc định khi đăng ký tài khoản (đăng nhập lần đầu qua Google OAuth), tài khoản mới luôn được gán vai trò `user` (`role: 'user'`).
  * Chỉ Admin mới có quyền cấp quyền quản trị bằng cách truy cập trực tiếp vào Firestore Database Console và chỉnh sửa thuộc tính `role` của user tương ứng thành `'admin'`. Hoàn toàn không có tùy chọn tự thay đổi vai trò trên giao diện client để tránh lỗ hổng bảo mật.
* **Giao diện trang Admin `/admin`**:
  * [Admin.tsx](file:///d:/Predict%20Football/src/pages/Admin.tsx) được phân làm 3 module chính:
    1. **Quản lý trận đấu**: Xem danh sách trận đấu và điều phối trạng thái (`scheduled` -> `live` -> `completed`). Khi chuyển sang `completed`, hiển thị Modal nhập tỉ số và chọn đội thắng kèo.
    2. **Thêm trận đấu**: Form nhập tên đội, tỉ lệ chấp, ngày giờ thi đấu. Hỗ trợ tính năng kéo thả upload ảnh để **mã hóa sang Base64** hoặc dán URL ảnh trực tiếp.
    3. **Cấu hình ứng dụng**: Đổi tiêu đề ứng dụng và ảnh nền tổng thể. Toàn bộ người dùng trực tuyến sẽ được cập nhật giao diện ngay lập tức nhờ cơ chế lắng nghe real-time `onSnapshot` của Firestore.

---

## 🎮 GIAI ĐOẠN 3: Sàn Dự Đoán cho Người dùng (Prediction Floor)
* **Xử lý logic Đặt cược**:
  * [predictionService.ts](file:///d:/Predict%20Football/src/lib/services/predictionService.ts): Lưu trữ dự đoán của user vào collection `predictions` với ID của document được đặt theo dạng ghép `${userId}_${matchId}` để đảm bảo không bị tạo trùng lặp và dễ dàng truy vấn.
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
  * Xây dựng [LanguageContext.tsx](file:///d:/Predict%20Football/src/context/LanguageContext.tsx) lưu trữ ngôn ngữ ở LocalStorage và hỗ trợ dịch động toàn bộ giao diện ở các trang `Login`, `Home`, và `Admin`.
* **Dự Đoán Hòa Có Điều Kiện & Nhãn "Hòa Kèo"**:
  * Ẩn nút "Hòa" ở các trận đấu có chấp bóng khác 0; nút Hòa chỉ xuất hiện khi tỷ lệ chấp là 0 (đồng banh).
  * Hiển thị nhãn chấp 0 là "Hòa Kèo" (VI) / "Draw Refund" (EN) trên giao diện.
* **Cải Tiến Bảng Excel & Độ Tương Phản**:
  * Thay thế nhãn dự đoán "Đúng/Sai" trong bảng Excel thành "Thắng/Thua" (VI) hoặc "Win/Loss" (EN).
  * Tối ưu hóa màu xanh và đỏ đậm của các lớp `.cell-thang` và `.cell-thua` trong `index.css` để đảm bảo độ tương phản cao, dễ nhìn trên cả Dark và Light mode.
* **Tự Động Chuyển Trực Tiếp (Auto-Live Status)**:
  * Thêm logic kiểm tra định kỳ mỗi 5 giây trong [Admin.tsx](file:///d:/Predict%20Football/src/pages/Admin.tsx) để tự động chuyển đổi trạng thái trận đấu từ `scheduled` sang `live` khi `now >= matchTime`.
* **Khắc Phục Giao Diện Admin & Nút Nhập Liệu**:
  * Đồng bộ nền body và overlay mờ động theo theme để sửa lỗi chữ sáng đè lên nền sáng gây mờ/nhoè giao diện.
  * Tích hợp lớp `.admin-input` vào toàn bộ input, select, và modal của trang quản trị để hiển thị rõ ràng, sắc nét và cao cấp hơn.

---

## 📱 GIAI ĐOẠN 6: Giao Diện Responsive & Banner Chạy Chữ Quảng Cáo Cảnh Báo (Session 3)
* **Banner chạy chữ cảnh báo (Warning Marquee Ticker)**:
  - Xây dựng Component [MarqueeTicker.tsx](file:///d:/Predict%20Football/src/components/MarqueeTicker.tsx) hiển thị dòng chữ chạy vô tận: *"Trang web được tạo ra với mục đích giải trí - Không cố súy cho các hành động cá cược - Cá cược tại Việt Nam là hành vi phạm pháp"*.
  - Tích hợp hiệu ứng chuyển động CSS dịch chuyển mượt mà liên tục (`translate3d(-50%, 0, 0)`) nhân đôi chuỗi văn bản cảnh báo cùng biểu tượng cảnh báo nhấp nháy (`AlertTriangle animate-pulse`) để đảm bảo không bị khoảng trống đứt gãy lúc lặp lại vòng mới.
  - Cấu hình banner chạy chữ cố định ở đầu trang cho tất cả các giao diện [Home.tsx](file:///d:/Predict%20Football/src/pages/Home.tsx), [Login.tsx](file:///d:/Predict%20Football/src/pages/Login.tsx), và [Admin.tsx](file:///d:/Predict%20Football/src/pages/Admin.tsx).
* **Tối ưu hóa hiển thị Responsive trên thiết bị di động (Mobile/Tablet)**:
  - **Cột cố định (Sticky Columns) trong bảng Excel**: Khắc phục lỗi chồng lấn cột "Tổng điểm" khi cuộn ngang trên di động bằng cách cố định kích thước các cột (Cột Hạng: `48px`, Cột Thành viên: `160px`, Cột Tổng điểm: `96px`) và gán các khoảng lệch trái tương ứng (`left-0`, `left-12` là `48px`, và `left-52` là `48+160 = 208px`).
  - **Header & Navigation**: Giảm kích thước đệm (paddings) và khoảng cách (gaps) của thanh điều hướng. Ẩn chữ của nút "Bảng điều khiển admin" chỉ hiển thị biểu tượng bánh răng/dashboard trên di động, rút gọn hiển thị avatar và chữ vai trò của user.
  - **Giao diện trang Admin di động**: Tự động chuyển đổi danh sách trận đấu CRUD từ dạng bảng ngang (dễ bị cuộn tràn khó bấm) sang cấu trúc thẻ (Cards) độc lập hiển thị thông tin rõ ràng và nút hành động to dễ nhấn trên màn hình cảm ứng di động (`block md:hidden`), đồng thời giữ nguyên giao diện bảng chuẩn cho máy tính (`hidden md:table`).
  - **Biểu mẫu & Modal**: Cập nhật các trường input URL logo và nút upload tệp sang chế độ xếp dọc (`flex-col`) trên màn hình nhỏ và xếp ngang (`sm:flex-row`) trên màn hình lớn. Thu hẹp paddings của form để vừa khít màn hình 320px mà không bị tràn viền ngang.
* **Tự động kết thúc trận đấu sau 120 phút trên Client-Side**:
  - Tích hợp logic kiểm tra thời gian thực so sánh `now` với thời điểm bóng lăn `matchTime` cộng thêm 120 phút.
  - Tự động thay đổi trạng thái hiển thị của trận đấu thành "Kết thúc" (Completed badge) và thay đổi tỷ số hiển thị thành "Đang cập nhật" (Updating) trên tab Sàn Dự Đoán nếu Admin chưa chính thức cập nhật kết quả trong cơ sở dữ liệu.
  - Khóa quyền thao tác và thay đổi vùng lựa chọn cược thành hộp hiển thị kết quả cược của người chơi với dòng chữ thông báo "Chờ cập nhật kết quả".

---

## 🧭 GIAI ĐOẠN 7: Tour Hướng Dẫn Driver.js, Chế Độ Khách & Tối Ưu Phân Quyền (Session 4)
* **Tour hướng dẫn onboarding tương tác (Driver.js Tour)**:
  - Tích hợp thư viện `driver.js` để giới thiệu các chức năng cốt lõi của giao diện (logo, banner chạy chữ, điểm số, sàn dự đoán, bảng xếp hạng Excel, nút khởi động tour).
  - Xây dựng custom hook [useAppTour.ts](file:///d:/Predict%20Football/src/hooks/useAppTour.ts) để điều phối các bước chạy tour và thay đổi ViewMode giữa sàn dự đoán và bảng xếp hạng Excel một cách nhịp nhàng.
  - Thiết kế CSS tùy chỉnh `.glass-driver-popover` trong [index.css](file:///d:/Predict%20Football/src/index.css) để mang lại phong cách Dark Glassmorphism đồng nhất với hệ thống.
* **Chế độ Khách (Guest Mode) không cần đăng nhập**:
  - Tích hợp nút "Xem với vai trò Khách" tại trang [Login.tsx](file:///d:/Predict%20Football/src/pages/Login.tsx) tạo phiên khách ảo lưu trữ tại `sessionStorage`.
  - Khóa quyền tương tác (vô hiệu hóa các nút dự đoán trận đấu, grayed out với `opacity-40 cursor-not-allowed`) và ẩn bộ theo dõi số lần chỉnh sửa cược trên giao diện để tránh khách gửi dự đoán cược.
  - Hiển thị banner cảnh báo nhắc nhở đăng nhập tài khoản Google để tham gia cược ở trang chủ.
  - Thay thế biểu tượng Logout bằng nút "Đăng nhập" (Sign In) nổi bật màu xanh dương tại Header cho khách để thuận tiện liên kết tài khoản Google thực bất kỳ lúc nào.
* **Tối ưu phân quyền Firestore & Dọn dẹp listener**:
  - Khắc phục lỗi ném ngoại lệ `FirebaseError: Missing or insufficient permissions` xảy ra khi khách ấn nút "Đăng nhập" bằng cách đưa `user` vào dependency array của các bộ lắng nghe `onSnapshot` trong [Home.tsx](file:///d:/Predict%20Football/src/pages/Home.tsx) và thêm kiểm tra `if (!user) return;` ở đầu hiệu ứng để tự động hủy subscription cũ khi đăng xuất.
  - Chuyển hướng log lỗi thành `console.warn` mang tính hướng dẫn khi lỗi là `permission-denied` giúp dễ dàng phát hiện khi chưa deploy rules.
  - Cập nhật [firestore.rules](file:///d:/Predict%20Football/firestore.rules) cấp quyền đọc công khai (`allow read: if true;`) cho các bảng dữ liệu `users`, `matches`, `predictions`, `settings` để khách có thể xem bảng xếp hạng và các trận đấu hợp lệ. Lập trình viên cần deploy rules này lên Firebase Console thực tế để hoạt động.

---

## 🛠️ Trạng thái biên dịch
* Lệnh build `npm run build` đã chạy thành công 100% không có lỗi ở phiên bản tích hợp tour hướng dẫn và chế độ khách mới nhất.
