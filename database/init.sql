-- ============================================================================
-- FOODHUB - KHỞI TẠO CƠ SỞ DỮ LIỆU MYSQL (DATABASE-PER-SERVICE)
-- ============================================================================
-- File này được mount vào /docker-entrypoint-initdb.d/init.sql của container
-- MySQL 8.0 và chỉ chạy tự động lần đầu khi volume dữ liệu chưa được khởi tạo.
--
-- Nguyên tắc thiết kế:
--   1. Một MySQL Server duy nhất, chia thành 5 database logic độc lập.
--   2. Mỗi Microservice có một tài khoản MySQL riêng và CHỈ được cấp quyền
--      trên database thuộc quyền quản lý của chính nó.
--   3. KHÔNG tạo bảng nghiệp vụ dùng chung tại đây; mỗi service tự quản lý
--      schema (JPA/Flyway/SQLAlchemy) và dữ liệu mẫu riêng.
--
-- Lưu ý bảo mật:
--   Mật khẩu bên dưới là mật khẩu mẫu cho môi trường phát triển cục bộ (dev),
--   khớp với file .env.example. Khi triển khai thực tế cần thay đổi mật khẩu.
-- ============================================================================

-- 1. Tạo 5 database logic với bộ mã UTF-8 đầy đủ (utf8mb4)
CREATE DATABASE IF NOT EXISTS `user_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `menu_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `cart_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `order_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `ai_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2. Tạo tài khoản MySQL riêng cho từng Microservice
CREATE USER IF NOT EXISTS 'user_svc'@'%' IDENTIFIED BY 'user_svc_pass_dev';
CREATE USER IF NOT EXISTS 'menu_svc'@'%' IDENTIFIED BY 'menu_svc_pass_dev';
CREATE USER IF NOT EXISTS 'cart_svc'@'%' IDENTIFIED BY 'cart_svc_pass_dev';
CREATE USER IF NOT EXISTS 'order_svc'@'%' IDENTIFIED BY 'order_svc_pass_dev';
CREATE USER IF NOT EXISTS 'ai_svc'@'%' IDENTIFIED BY 'ai_svc_pass_dev';

-- 3. Cấp quyền độc lập theo đúng phạm vi Database-per-Service
-- Không cấp quyền truy cập chéo giữa các database
GRANT ALL PRIVILEGES ON `user_db`.* TO 'user_svc'@'%';
GRANT ALL PRIVILEGES ON `menu_db`.* TO 'menu_svc'@'%';
GRANT ALL PRIVILEGES ON `cart_db`.* TO 'cart_svc'@'%';
GRANT ALL PRIVILEGES ON `order_db`.* TO 'order_svc'@'%';
GRANT ALL PRIVILEGES ON `ai_db`.* TO 'ai_svc'@'%';

FLUSH PRIVILEGES;
