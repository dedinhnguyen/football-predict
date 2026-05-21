# Architecture, Tech Stack & MCP Guidelines

## 1. Technology Stack
- **Frontend:** Next.js (App Router), Tailwind CSS, Shadcn/ui.
- **Excel Table Component:** TanStack Table (React Table) hỗ trợ Pinning Column (Cố định cột STT, Tên, Điểm).
- **Backend:** Next.js Server Actions hoặc Node.js (FastAPI/Express).
- **Database:** MongoDB (Linh hoạt cho việc tổng hợp dữ liệu mượt mà) hoặc PostgreSQL sử dụng Prisma ORM.
- **Auth:** NextAuth.js tích hợp Google Provider.

## 2. API Endpoints / Trực quan hóa Kiến trúc
### Auth Routes
- `GET /api/auth/signin` -> Kích hoạt Google Sign-In.

### User Endpoints
- `GET /api/matches/history` -> Lấy 8 trận gần nhất kèm trạng thái Thắng/Thua của User.
- `GET /api/matches/active` -> Lấy danh sách trận chuẩn bị diễn ra.
- `POST /api/predictions` -> Gửi hoặc cập nhật dự đoán (Kiểm tra logic `modificationCount < 2` và `matchTime > thời gian hiện tại + 15 phút`).
- `GET /api/leaderboard` -> Trả về cấu trúc mảng tối ưu để render bảng Excel.

### Admin Endpoints
- `POST /api/admin/matches` -> Tạo trận đấu mới.
- `PUT /api/admin/matches/:id/status` -> Cập nhật trạng thái trận đấu & trigger tính toán điểm tự động.

## 3. Quy tắc xử lý Logic đặc biệt
- **Hệ thống tính điểm:** Khi Admin chuyển trạng thái trận đấu sang `completed`, Backend chạy một hàm Async xử lý:
  1. Tìm tất cả các `Predictions` có `matchId` tương ứng.
  2. So sánh `predictedChoice` với `winningKeeo`. Nếu trùng khớp -> set `isCorrect = true`.
  3. Tăng `totalPoints` của User thắng cuộc lên +1.