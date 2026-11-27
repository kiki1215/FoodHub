# TÀI LIỆU ĐẶC TẢ API (API CONTRACT) – FOODHUB

Tài liệu này mô tả đầy đủ hợp đồng giao tiếp RESTful API giữa Frontend / Client với hệ thống Backend Microservices của **FOODHUB** thông qua **API Gateway** (`http://localhost:8080`), cũng như các **API nội bộ (service-to-service)** chỉ chạy trong mạng Docker.

---

## 1. Quy ước chung

### 1.1. Base URL
- **API Gateway (Cổng duy nhất cho Frontend/Postman):** `http://localhost:8080`
- **Mạng nội bộ Docker (chỉ giữa các Microservices):**
  - `user-service`: `http://user-service:8081`
  - `menu-service`: `http://menu-service:8082`
  - `cart-service`: `http://cart-service:8083`
  - `order-service`: `http://order-service:8084`

### 1.2. Chuẩn JSON phản hồi thống nhất
Mọi API (thành công hoặc lỗi, kể cả lỗi từ API Gateway) đều trả về cấu trúc:
```json
{
  "success": true,
  "message": "Thông báo tiếng Việt",
  "data": {}
}
```

### 1.3. Cơ chế xác thực & Header
- **Client gửi lên API Gateway:** `Authorization: Bearer <jwt_token>`
- **API Gateway xử lý:**
  1. Xóa toàn bộ `X-User-Id` và `X-User-Role` do Client tự gửi (chống giả mạo).
  2. Chặn tuyệt đối mọi đường dẫn `/internal/**`.
  3. Kiểm tra JWT đối với các route yêu cầu đăng nhập; kiểm tra quyền `ADMIN` đối với `/api/admin/**`.
  4. Gắn lại `X-User-Id` và `X-User-Role` tin cậy rồi chuyển tiếp xuống service con.
- **Mã lỗi chuẩn:**
  - `400 Bad Request`: Dữ liệu đầu vào không hợp lệ, vi phạm quy tắc nghiệp vụ (đổi SĐT, số lượng ≤ 0, chuyển trạng thái sai, món hết hàng).
  - `401 Unauthorized`: Thiếu JWT, JWT không hợp lệ hoặc hết hạn, sai thông tin đăng nhập.
  - `403 Forbidden`: Không đủ quyền (Customer gọi API Admin, xem đơn của người khác, tài khoản bị khóa).
  - `404 Not Found`: Không tìm thấy tài nguyên.
  - `409 Conflict`: Xung đột dữ liệu (email trùng, tên danh mục trùng, danh mục đang có món, giá món thay đổi khi đặt hàng, `Idempotency-Key` trùng nhưng khác nội dung, xóa user còn đơn chưa hoàn tất).
  - `503 Service Unavailable`: Dịch vụ đích tạm thời không khả dụng.

---

## 2. API CÔNG KHAI & NGƯỜI DÙNG QUA API GATEWAY (`http://localhost:8080`)

### 2.1. User Service — Xác thực & Hồ sơ

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `POST` | `/api/auth/register` | Công khai | Đăng ký tài khoản `CUSTOMER` mới |
| `POST` | `/api/auth/login` | Công khai | Đăng nhập email/mật khẩu, nhận JWT |
| `GET` | `/api/users/me` | `CUSTOMER` / `ADMIN` | Xem hồ sơ cá nhân |
| `PUT` | `/api/users/me` | `CUSTOMER` / `ADMIN` | Cập nhật hồ sơ (chặn đổi số điện thoại) |
| `PATCH` | `/api/users/me/avatar` | `CUSTOMER` / `ADMIN` | Cập nhật ảnh đại diện |

**Ví dụ `POST /api/auth/register`:**
```json
// Request
{
  "fullName": "Nguyễn Văn An",
  "email": "an.nguyen@foodhub.local",
  "password": "Password123",
  "phone": "0912345678",
  "address": "Quận 1, TP.HCM"
}
// Response 201 Created
{
  "success": true,
  "message": "Đăng ký tài khoản thành công",
  "data": {
    "id": 2,
    "fullName": "Nguyễn Văn An",
    "email": "an.nguyen@foodhub.local",
    "phone": "0912345678",
    "address": "Quận 1, TP.HCM",
    "avatarUrl": null,
    "role": "CUSTOMER",
    "active": true
  }
}
```

### 2.2. User Service — Quản trị người dùng (`ADMIN`)

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/api/admin/users?keyword=&role=&active=` | `ADMIN` | Danh sách & tìm kiếm tài khoản |
| `GET` | `/api/admin/users/{id}` | `ADMIN` | Xem chi tiết người dùng |
| `PUT` | `/api/admin/users/{id}` | `ADMIN` | Cập nhật thông tin người dùng |
| `PATCH` | `/api/admin/users/{id}/role` | `ADMIN` | Phân quyền (`{"role": "CUSTOMER" \| "ADMIN"}`) |
| `PATCH` | `/api/admin/users/{id}/status` | `ADMIN` | Khóa/mở khóa (`{"active": true \| false}`) |
| `DELETE` | `/api/admin/users/{id}` | `ADMIN` | Xóa tài khoản (chặn tự xóa & chặn xóa user còn đơn chưa hoàn tất) |

---

### 2.3. Menu Service — Danh mục & Món ăn

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/api/categories?keyword=` | Công khai | Danh sách & tìm kiếm danh mục |
| `GET` | `/api/categories/{id}` | Công khai | Chi tiết danh mục |
| `GET` | `/api/products?keyword=&categoryId=&status=&page=0&size=10&sortBy=createdAt&sortDir=desc` | Công khai | Danh sách món ăn có tìm kiếm, lọc, phân trang |
| `GET` | `/api/products/best-sellers?limit=8&timeSlot=` | Công khai | Món bán chạy (hỗ trợ `MORNING`/`LUNCH`/`AFTERNOON`/`DINNER`/`CURRENT`) |
| `GET` | `/api/products/{id}` | Công khai | Chi tiết món ăn |
| `GET` | `/api/products/images/{fileName}` | Công khai | Phục vụ file ảnh tĩnh đã upload |
| `POST` | `/api/admin/categories` | `ADMIN` | Thêm danh mục |
| `PUT` | `/api/admin/categories/{id}` | `ADMIN` | Sửa danh mục |
| `DELETE` | `/api/admin/categories/{id}` | `ADMIN` | Xóa danh mục (chặn `409` nếu còn món ăn) |
| `POST` | `/api/admin/products` | `ADMIN` | Thêm món ăn mới |
| `PUT` | `/api/admin/products/{id}` | `ADMIN` | Sửa món ăn |
| `PATCH` | `/api/admin/products/{id}/status` | `ADMIN` | Đổi trạng thái (`AVAILABLE` / `OUT_OF_STOCK` / `STOPPED`) |
| `DELETE` | `/api/admin/products/{id}` | `ADMIN` | Xóa món ăn |
| `POST` | `/api/admin/products/upload-image` | `ADMIN` | Upload ảnh (`multipart/form-data`, key `file`, tối đa 5MB) |

---

### 2.4. Cart Service — Giỏ hàng (Bắt buộc đăng nhập)

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/api/cart` | `CUSTOMER` / `ADMIN` | Xem giỏ hàng của người dùng hiện tại |
| `POST` | `/api/cart/items` | `CUSTOMER` / `ADMIN` | Thêm món vào giỏ (`{"productId": 1, "quantity": 2}`) |
| `PUT` | `/api/cart/items/{productId}` | `CUSTOMER` / `ADMIN` | Cập nhật số lượng (`{"quantity": 3}`, bắt buộc `> 0`) |
| `PATCH` | `/api/cart/items/{productId}/increase` | `CUSTOMER` / `ADMIN` | Tăng số lượng lên 1 |
| `PATCH` | `/api/cart/items/{productId}/decrease` | `CUSTOMER` / `ADMIN` | Giảm số lượng đi 1 (báo lỗi `400` nếu về `0`) |
| `DELETE` | `/api/cart/items/{productId}` | `CUSTOMER` / `ADMIN` | Xóa 1 món khỏi giỏ |
| `DELETE` | `/api/cart` | `CUSTOMER` / `ADMIN` | Xóa toàn bộ giỏ hàng |

**Ví dụ `POST /api/cart/items`:**
```json
// Request
{
  "productId": 1,
  "quantity": 2
}
// Response 201 Created
{
  "success": true,
  "message": "Thêm món vào giỏ hàng thành công",
  "data": {
    "userId": 2,
    "items": [
      {
        "id": 1,
        "productId": 1,
        "productName": "Cơm gà xối mỡ",
        "unitPrice": 55000,
        "quantity": 2,
        "subtotal": 110000
      }
    ],
    "totalItems": 1,
    "totalQuantity": 2,
    "totalAmount": 110000
  }
}
```

---

### 2.5. Order Service — Đặt hàng COD & Quản lý đơn hàng

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `POST` | `/api/orders` | `CUSTOMER` / `ADMIN` | Tạo đơn hàng COD từ giỏ hàng. Hỗ trợ Header `Idempotency-Key` |
| `GET` | `/api/orders/my?status=` | `CUSTOMER` / `ADMIN` | Xem lịch sử đơn hàng của chính mình |
| `GET` | `/api/orders/{id}` | Chủ đơn / `ADMIN` | Xem chi tiết đơn hàng (chặn `403` nếu xem đơn người khác) |
| `GET` | `/api/admin/orders?orderCode=&status=&page=0&size=10` | `ADMIN` | Xem toàn bộ đơn, tìm mã đơn, lọc trạng thái, phân trang |
| `GET` | `/api/admin/orders/{id}` | `ADMIN` | Xem chi tiết đơn hàng bất kỳ |
| `PATCH` | `/api/admin/orders/{id}/status` | `ADMIN` | Cập nhật trạng thái đơn hàng theo quy tắc chuyển trạng thái |

**Quy tắc chuyển trạng thái hợp lệ:**
- `PENDING` → `CONFIRMED` hoặc `CANCELLED`
- `CONFIRMED` → `PREPARING` hoặc `CANCELLED`
- `PREPARING` → `SHIPPING` hoặc `CANCELLED`
- `SHIPPING` → `COMPLETED`
- `COMPLETED` và `CANCELLED`: trạng thái kết thúc, không thể chuyển tiếp.

**Ví dụ `POST /api/orders` (kèm Header `Authorization: Bearer <token>` và `Idempotency-Key: order-key-001`):**
```json
// Request
{
  "receiverName": "Nguyễn Văn An",
  "receiverPhone": "0912345678",
  "shippingAddress": "123 Lê Lợi, Quận 1, TP.HCM",
  "note": "Giao giờ trưa, ít ớt",
  "paymentMethod": "COD",
  "confirmPriceChange": false
}
// Response 201 Created
{
  "success": true,
  "message": "Đặt hàng thành công",
  "data": {
    "id": 1,
    "orderCode": "FH-20261127-A1B2C3",
    "userId": 2,
    "receiverName": "Nguyễn Văn An",
    "receiverPhone": "0912345678",
    "shippingAddress": "123 Lê Lợi, Quận 1, TP.HCM",
    "paymentMethod": "COD",
    "status": "PENDING",
    "totalAmount": 110000,
    "items": [
      {
        "productId": 1,
        "productName": "Cơm gà xối mỡ",
        "unitPrice": 55000,
        "quantity": 2,
        "subtotal": 110000
      }
    ]
  }
}
```
- **Khi giá món thay đổi:** trả `409 Conflict` kèm `data.priceChanges` và `data.newTotalAmount`, **không xóa giỏ hàng**. Khách gửi lại với `"confirmPriceChange": true` để xác nhận đặt theo giá mới.
- **Khi gửi trùng `Idempotency-Key`:**
  - Cùng nội dung request → trả `200 OK` cùng đơn hàng đã tạo trước đó (không tạo đơn thứ 2).
  - Khác nội dung request → trả `409 Conflict`.

---

### 2.6. API Thống kê Dashboard (`ADMIN` — tách đúng trách nhiệm từng service)

| Method | Endpoint | Service đích | Dữ liệu trả về |
|---|---|---|---|
| `GET` | `/api/admin/stats/users` | `user-service` | `totalUsers`, `activeUsers`, `lockedUsers`, `customerCount`, `adminCount` |
| `GET` | `/api/admin/stats/menu` | `menu-service` | `totalProducts`, `availableProducts`, `outOfStockProducts`, `stoppedProducts`, `totalCategories` |
| `GET` | `/api/admin/stats/orders?year=&month=&topLimit=5` | `order-service` | `totalOrders`, `completedRevenue`, `ordersByStatus`, `topSellingProducts` |

---

## 3. API NỘI BỘ (SERVICE-TO-SERVICE — KHÔNG PUBLIC QUA GATEWAY)

Các endpoint dưới đây chỉ phục vụ giao tiếp giữa các Microservices trong mạng Docker `foodhub-network`; mọi request tới `/internal/**` đi qua API Gateway đều bị chặn.

| Service | Method | Endpoint nội bộ | Bên gọi | Mục đích |
|---|---|---|---|---|
| `menu-service` (`:8082`) | `GET` | `/internal/products/{id}/check` | `cart-service`, `order-service` | Kiểm tra tồn tại, trạng thái `AVAILABLE` và giá bán hiện tại |
| `menu-service` (`:8082`) | `GET` | `/internal/products/{id}/exists` | Các service nội bộ | Kiểm tra sản phẩm có tồn tại hay không |
| `menu-service` (`:8082`) | `POST` | `/internal/products/batch` | `ai-service` | Lấy thông tin nhiều món theo danh sách ID |
| `menu-service` (`:8082`) | `GET` | `/internal/products/best-sellers?limit=&timeSlot=` | `ai-service` | Lấy danh sách món bán chạy (hỗ trợ khung giờ) |
| `menu-service` (`:8082`) | `PATCH` | `/internal/products/{id}/sold-count?quantity=` | `order-service` | Cộng dồn lượt bán sau khi đặt đơn thành công |
| `cart-service` (`:8083`) | `GET` | `/internal/cart/{userId}` | `order-service` | Lấy giỏ hàng của khách hàng khi đặt đơn |
| `cart-service` (`:8083`) | `DELETE` | `/internal/cart/{userId}` | `order-service` | Xóa giỏ hàng sau khi tạo đơn hàng thành công |
| `order-service` (`:8084`) | `GET` | `/internal/orders/users/{userId}/has-unfinished` | `user-service` | Kiểm tra user có còn đơn chưa hoàn tất (`PENDING`/`CONFIRMED`/`PREPARING`/`SHIPPING`) trước khi xóa tài khoản |
