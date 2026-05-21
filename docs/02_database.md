# Database Schema Design (PostgreSQL / MongoDB Friendly)

## 1. Collection/Table: Users
Lưu trữ thông tin người dùng đăng nhập bằng Google.
```json
{
  "_id": "ObjectId",
  "email": "string (unique)",
  "displayName": "string",
  "avatarUrl": "string",
  "role": "string ('user' hoặc 'admin')",
  "totalPoints": "number (default: 0)",
  "createdAt": "date"
}
```

## 2. Collection/Table: Matches
Lưu trữ thông tin trận đấu và trạng thái dự đoán.
```json
{
  "_id": "ObjectId",
  "homeTeam": {
    "name": "string",
    "logoUrl": "string"
  },
  "awayTeam": {
    "name": "string",
    "logoUrl": "string"
  },
  "matchTime": "date",
  "handicap": "number (0, 0.5, 1, 1.5, 2)", 
  "status": "string ('scheduled', 'live', 'completed')",
  "result": {
    "homeScore": "number",
    "awayScore": "number",
    "winningKeeo": "string ('home', 'away', 'draw')" 
  },
  "createdAt": "date"
}
```

## 3. Collection/Table: UserPredictions
Lưu trữ các lựa chọn dự đoán của từng user đối với từng trận đấu để phục vụ việc render bảng Excel và khóa form.

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (Reference Users)",
  "matchId": "ObjectId (Reference Matches)",
  "predictedChoice": "string ('home' hoặc 'away')",
  "modificationCount": "number (mặc định là 0, tối đa là 2)",
  "isLocked": "boolean (default: false)",
  "isCorrect": "boolean (null nếu trận chưa đá, true/false sau khi completed)",
  "updatedAt": "date"
}   
```

## 4. Collection/Table: AppSettings
Lưu cấu hình giao diện và các thông số chung.
```json
{
  "_id": "ObjectId",
  "appTitle": "string (Tên App)",
  "defaultBgImage": "string (URL Ảnh nền mặc định)",
  "themeConfig": "object (Màu sắc, font chữ)",
  "matchLockTimeMinutes": "number (Thời gian khóa dự đoán, ví dụ: 15)",
  "createdAt": "date"
}   
```

