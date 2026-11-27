package com.foodhub.user.service;

import com.foodhub.user.dto.*;
import com.foodhub.user.entity.Role;
import com.foodhub.user.entity.User;
import com.foodhub.user.exception.AppException;
import com.foodhub.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OrderClient orderClient;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       OrderClient orderClient) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.orderClient = orderClient;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new AppException(HttpStatus.CONFLICT, "Email này đã được đăng ký trong hệ thống");
        }

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone().trim());
        user.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        user.setRole(Role.CUSTOMER);
        user.setActive(true);

        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không chính xác");
        }

        if (!user.isActive()) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị khóa, vui lòng liên hệ quản trị viên");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, jwtService.getExpirationMs(), UserResponse.fromEntity(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(Long currentUserId) {
        User user = findUserOrThrow(currentUserId);
        if (!user.isActive()) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị khóa");
        }
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public UserResponse updateProfile(Long currentUserId, UpdateProfileRequest request) {
        User user = findUserOrThrow(currentUserId);
        if (!user.isActive()) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị khóa");
        }

        // Chặn khách hàng tự thay đổi số điện thoại theo đặc tả
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String requestedPhone = request.getPhone().trim();
            String currentPhone = user.getPhone() != null ? user.getPhone().trim() : "";
            if (!requestedPhone.equals(currentPhone)) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Khách hàng không được phép tự thay đổi số điện thoại");
            }
        }

        user.setFullName(request.getFullName().trim());
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress().trim());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        User updated = userRepository.save(user);
        return UserResponse.fromEntity(updated);
    }

    @Transactional
    public UserResponse updateAvatar(Long currentUserId, UpdateAvatarRequest request) {
        User user = findUserOrThrow(currentUserId);
        if (!user.isActive()) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị khóa");
        }

        user.setAvatarUrl(request.getAvatarUrl().trim());
        User updated = userRepository.save(user);
        return UserResponse.fromEntity(updated);
    }

    // ==================== CHỨC NĂNG QUẢN TRỊ (ADMIN) ====================

    @Transactional(readOnly = true)
    public List<UserResponse> searchUsers(String keyword, Role role, Boolean active) {
        String trimmedKeyword = keyword != null ? keyword.trim() : null;
        return userRepository.searchUsers(trimmedKeyword, role, active)
                .stream()
                .map(UserResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long targetUserId) {
        return UserResponse.fromEntity(findUserOrThrow(targetUserId));
    }

    @Transactional
    public UserResponse adminUpdateUser(Long currentAdminId, Long targetUserId, AdminUpdateUserRequest request) {
        User target = findUserOrThrow(targetUserId);

        if (request.getRole() != null && request.getRole() != target.getRole()) {
            validateRoleChange(currentAdminId, target, request.getRole());
            target.setRole(request.getRole());
        }

        if (request.getActive() != null && request.getActive() != target.isActive()) {
            validateStatusChange(currentAdminId, target, request.getActive());
            target.setActive(request.getActive());
        }

        target.setFullName(request.getFullName().trim());
        if (request.getPhone() != null) {
            target.setPhone(request.getPhone().isBlank() ? null : request.getPhone().trim());
        }
        if (request.getAddress() != null) {
            target.setAddress(request.getAddress().trim());
        }
        if (request.getAvatarUrl() != null) {
            target.setAvatarUrl(request.getAvatarUrl().trim());
        }

        return UserResponse.fromEntity(userRepository.save(target));
    }

    @Transactional
    public UserResponse updateUserRole(Long currentAdminId, Long targetUserId, Role newRole) {
        User target = findUserOrThrow(targetUserId);
        if (target.getRole() != newRole) {
            validateRoleChange(currentAdminId, target, newRole);
            target.setRole(newRole);
            target = userRepository.save(target);
        }
        return UserResponse.fromEntity(target);
    }

    @Transactional
    public UserResponse updateUserStatus(Long currentAdminId, Long targetUserId, boolean newActive) {
        User target = findUserOrThrow(targetUserId);
        if (target.isActive() != newActive) {
            validateStatusChange(currentAdminId, target, newActive);
            target.setActive(newActive);
            target = userRepository.save(target);
        }
        return UserResponse.fromEntity(target);
    }

    @Transactional
    public void deleteUser(Long currentAdminId, Long targetUserId) {
        if (currentAdminId.equals(targetUserId)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Không thể tự xóa tài khoản quản trị đang đăng nhập");
        }

        User target = findUserOrThrow(targetUserId);
        if (target.getRole() == Role.ADMIN && target.isActive()
                && userRepository.countByRoleAndActiveTrue(Role.ADMIN) <= 1) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Không thể xóa quản trị viên hoạt động cuối cùng của hệ thống");
        }

        // Kiểm tra qua Order Service: chặn xóa nếu người dùng còn đơn hàng chưa hoàn tất
        if (orderClient.hasUnfinishedOrders(targetUserId)) {
            throw new AppException(HttpStatus.CONFLICT,
                    "Không thể xóa tài khoản vì người dùng vẫn còn đơn hàng chưa hoàn tất");
        }

        userRepository.delete(target);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getUserStats() {
        long total = userRepository.count();
        long active = userRepository.countByActiveTrue();
        long customers = userRepository.countByRole(Role.CUSTOMER);
        long admins = userRepository.countByRole(Role.ADMIN);

        java.util.Map<String, Object> stats = new java.util.LinkedHashMap<>();
        stats.put("totalUsers", total);
        stats.put("activeUsers", active);
        stats.put("lockedUsers", total - active);
        stats.put("customerCount", customers);
        stats.put("adminCount", admins);
        return stats;
    }

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
    }

    private void validateRoleChange(Long currentAdminId, User target, Role newRole) {
        if (currentAdminId.equals(target.getId()) && newRole != Role.ADMIN) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Không thể tự thay đổi quyền quản trị của chính mình");
        }
        if (target.getRole() == Role.ADMIN && newRole != Role.ADMIN && target.isActive()
                && userRepository.countByRoleAndActiveTrue(Role.ADMIN) <= 1) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Hệ thống phải có ít nhất một quản trị viên đang hoạt động");
        }
    }

    private void validateStatusChange(Long currentAdminId, User target, boolean newActive) {
        if (currentAdminId.equals(target.getId()) && !newActive) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Không thể tự khóa tài khoản đang đăng nhập");
        }
        if (target.getRole() == Role.ADMIN && !newActive && target.isActive()
                && userRepository.countByRoleAndActiveTrue(Role.ADMIN) <= 1) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Không thể khóa quản trị viên hoạt động cuối cùng của hệ thống");
        }
    }
}
