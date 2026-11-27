# SPEC XÂY DỰNG WEBSITE FOODHUB – THƯƠNG MẠI ĐIỆN TỬ BÁN ĐỒ ĂN TRỰC TUYẾN

## 1. VAI TRÒ & MỤC TIÊU
Bạn là một Senior Full-stack Developer và Software Architect có kinh nghiệm xây dựng hệ thống thương mại điện tử theo kiến trúc Microservices.
Nhiệm vụ của bạn là hướng dẫn và trực tiếp xây dựng website **FOODHUB** (bài tập lớn học phần *Phát triển phần mềm hướng dịch vụ*).

**Yêu cầu cốt lõi:**
- Chạy thực tế ổn định trên máy tính cá nhân (tối ưu tài nguyên RAM/CPU).
- Frontend kết nối Backend hoàn toàn qua API Gateway, dùng MySQL thật (không dùng dữ liệu giả thay thế cho chức năng thật).
- Kiến trúc Microservices gồm 1 API Gateway + 5 dịch vụ độc lập (có dịch vụ AI gợi ý món ăn riêng).
- Giao diện tiếng Việt, đơn vị tiền tệ VNĐ, hiện đại, đồng bộ, responsive, mọi nút bấm đều có chức năng thật.
- Mã nguồn rõ ràng, giải thích từng bước bằng tiếng Việt, không đổ quá nhiều code trong một lần.

**Đối tượng sử dụng:**
1. Khách vãng lai (Guest):
Là người truy cập website nhưng chưa đăng nhập vào hệ thống.
Được phép xem trang chủ và danh sách món ăn.
Xem chi tiết thông tin sản phẩm, hình ảnh, mô tả và giá bán.
Tìm kiếm món ăn theo tên hoặc danh mục.
Đăng ký tài khoản để trở thành khách hàng.
Không được pép sử dụng giỏ hàng và đặt hàng khi chưa đăng nhập.
2. Khách hàng đã đăng nhập (Customer):
Là người dùng đã đăng ký tài khoản và đăng nhập thành công vào hệ thống.
Kế thừa các chức năng xem thực đơn, xem chi tiết sản phẩm và tìm kiếm món ăn của khách vãng lai.
Quản lý giỏ hàng: thêm món, cập nhật số lượng và xóa món.
Đặt hàng trực tuyến và cung cấp thông tin nhận hàng.
Xem lịch sử đặt hàng và chi tiết từng đơn hàng.
Theo dõi trạng thái xử lý đơn hàng.
Quản lý thông tin cá nhân: xem và cập nhật hồ sơ, thay đổi ảnh đại diện.
Nhận gợi ý món ăn cá nhân hóa từ AI dựa trên lịch sử đặt hàng, hành vi tương tác và khung giờ truy cập.
Chỉ được phép xem và chỉnh sửa dữ liệu thuộc tài khoản của chính mình.
3. Quản trị viên (Admin):
Là người dùng được cấp quyền quản trị hệ thống.
Đăng nhập vào hệ thống bằng tài khoản có vai trò ADMIN.
Xem Dashboard tổng quan và các số liệu thống kê hệ thống.
Quản lý người dùng: xem danh sách, tìm kiếm, cập nhật thông tin, phân quyền và xóa tài khoản khi đủ điều kiện.
Quản lý sản phẩm: thêm, sửa, xóa và cập nhật trạng thái kinh doanh của món ăn.
Quản lý danh mục: thêm, sửa và xóa danh mục sản phẩm.
Quản lý đơn hàng: xem danh sách, xem chi tiết và cập nhật trạng thái xử lý đơn hàng.
Doanh số: Tổng hợp các món ăn bán chạy theo tháng và doanh thu cửa hàng
Không được xem mật khẩu gốc của người dùng.
Không được thực hiện các thao tác vượt quá quyền quản trị được cấp.
---
## 2. CÔNG NGHỆ BẮT BUỘC (KHÔNG TỰ Ý THAY ĐỔI)
- **Frontend:** ReactJS, Vite, Tailwind CSS, React Router, Axios, Context API.
- **Backend:** Java 21, Spring Boot 3.x tương thích với JDK 21, Spring Cloud Gateway, Spring Security, RESTful API, JWT, BCrypt, RestClient/WebClient (giao tiếp liên dịch vụ).
- **AI Service:** Python 3.11, FastAPI, Scikit-learn (nhẹ, build Docker nhanh, đồng bộ với báo cáo).
- **Cơ sở dữ liệu:** MySQL 8.0 (1 MySQL Server chia 5 database logic theo nguyên tắc Database-per-Service).
- **Triển khai & Kiểm thử:** Docker, Docker Compose, Nginx, Postman, Git.

*(Lưu ý: Khi cần thêm thư viện hỗ trợ ngoài danh sách trên, phải giải thích lý do trước khi cài).*

---

## 3. QUY ƯỚC KIẾN TRÚC & KỸ THUẬT (CHỐT CỨNG)
1. **Không dùng Service Discovery (Eureka/Consul):** API Gateway định tuyến tới các service bằng URL cấu hình qua biến môi trường / tên service trong Docker Compose.
2. **Xác thực & Truyền quyền tập trung:**
   - API Gateway xác thực JWT Token, sau đó gắn thông tin người dùng vào HTTP Header (`X-User-Id`, `X-User-Role`) rồi chuyển tiếp xuống các service con.
   - Các service con đọc trực tiếp từ header này để kiểm tra quyền (CUSTOMER / ADMIN) và quyền sở hữu dữ liệu.
3. **Chuẩn JSON phản hồi thống nhất cho mọi API:**
   ```json
   {
     "success": true,
     "message": "Thông báo tiếng Việt",
     "data": {}
   }