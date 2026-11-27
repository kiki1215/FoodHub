# FOODHUB – Hệ thống Thương mại Điện tử Bán Đồ Ăn Trực Tuyến

Dự án bài tập lớn học phần **Phát triển phần mềm hướng dịch vụ**, xây dựng theo kiến trúc **Microservices** gồm Frontend, API Gateway, 5 dịch vụ độc lập (4 Spring Boot + 1 AI FastAPI) và MySQL 8.0 (Database-per-Service).

---

## 1. Cấu trúc thư mục dự án

```text
foodhub/
├── SPEC.md                 # Đặc tả chính thức của hệ thống
├── .gitignore              # Loại trừ file nhạy cảm, build, cache
├── .env.example            # File cấu hình biến môi trường mẫu
├── README.md               # Hướng dẫn tổng quan & khởi chạy
├── docker-compose.yml      # Khởi chạy hạ tầng & dịch vụ bằng Docker
├── frontend/               # ReactJS + Vite + Tailwind CSS
├── backend/
│   ├── api-gateway/        # Spring Cloud Gateway (cổng 8080)
│   ├── user-service/       # Quản lý người dùng & Auth (cổng 8081)
│   ├── menu-service/       # Quản lý danh mục & món ăn (cổng 8082)
│   ├── cart-service/       # Quản lý giỏ hàng (cổng 8083)
│   └── order-service/      # Quản lý đơn hàng & thống kê (cổng 8084)
├── ai-service/             # Gợi ý món ăn FastAPI + Scikit-learn (cổng 8000)
├── database/
│   └── init.sql            # Khởi tạo 5 database logic & 5 user phân quyền
└── docs/
    └── ARCHITECTURE.md     # Tài liệu kiến trúc chi tiết
```

---

## 2. Yêu cầu môi trường

- **Java JDK 21 LTS**
- **Apache Maven 3.9.x**
- **Node.js 22/24 LTS** & **npm**
- **Python 3.11**
- **Docker Desktop** & **Docker Compose**
- **Git**

---

## 3. Khởi tạo hạ tầng MySQL (Giai đoạn 1)

### Bước 1: Tạo file `.env` từ file mẫu
```powershell
Copy-Item .env.example .env
```
*(Có thể mở `.env` để đổi `MYSQL_ROOT_PASSWORD` và `JWT_SECRET` nếu muốn; giữ nguyên các mật khẩu `*_DB_PASSWORD` nếu dùng trực tiếp `database/init.sql` mặc định).*

### Bước 2: Khởi chạy container MySQL
Đảm bảo **Docker Desktop** đang chạy, sau đó thực thi:
```powershell
docker compose up -d mysql
```

### Bước 3: Kiểm tra trạng thái container và 5 database
```powershell
docker compose ps
docker exec -it foodhub-mysql mysql -u root -p -e "SHOW DATABASES;"
```
*(Nhập mật khẩu `MYSQL_ROOT_PASSWORD` trong file `.env`. Kết quả cần có đầy đủ 5 database: `user_db`, `menu_db`, `cart_db`, `order_db`, `ai_db`).*

Kiểm tra quyền phân tách tài khoản theo từng service:
```powershell
docker exec -it foodhub-mysql mysql -u user_svc -puser_svc_pass_dev -e "SHOW DATABASES;"
```
*(Tài khoản `user_svc` chỉ nhìn thấy `user_db`, không thấy 4 database còn lại).*

---

## 4. Tài liệu tham khảo

- Đặc tả yêu cầu & nghiệp vụ: [SPEC.md](./SPEC.md)
- Kiến trúc hệ thống & cổng dịch vụ: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
