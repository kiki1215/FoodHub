package com.foodhub.user.config;

import com.foodhub.user.entity.Role;
import com.foodhub.user.entity.User;
import com.foodhub.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.admin.name:Quản trị viên FOODHUB}")
    private String adminName;

    public AdminSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            log.warn("Chưa cấu hình DEFAULT_ADMIN_EMAIL hoặc DEFAULT_ADMIN_PASSWORD, bỏ qua khởi tạo tài khoản ADMIN mẫu.");
            return;
        }

        String normalizedEmail = adminEmail.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.info("Tài khoản ADMIN mẫu ({}) đã tồn tại, giữ nguyên dữ liệu hiện có.", normalizedEmail);
            return;
        }

        User admin = new User();
        admin.setFullName(adminName != null && !adminName.isBlank() ? adminName.trim() : "Quản trị viên FOODHUB");
        admin.setEmail(normalizedEmail);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);
        admin.setActive(true);

        userRepository.save(admin);
        log.info("Đã khởi tạo tài khoản ADMIN mẫu thành công ({}).", normalizedEmail);
    }
}
