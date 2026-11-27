package com.foodhub.user.controller;

import com.foodhub.user.dto.*;
import com.foodhub.user.entity.Role;
import com.foodhub.user.exception.AppException;
import com.foodhub.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> listUsers(
            @RequestHeader("X-User-Role") String currentUserRole,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean active) {
        requireAdmin(currentUserRole);
        List<UserResponse> users = userService.searchUsers(keyword, role, active);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách người dùng thành công", users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserDetail(
            @RequestHeader("X-User-Role") String currentUserRole,
            @PathVariable Long id) {
        requireAdmin(currentUserRole);
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết người dùng thành công", user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @RequestHeader("X-User-Id") Long currentAdminId,
            @RequestHeader("X-User-Role") String currentUserRole,
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        requireAdmin(currentUserRole);
        UserResponse updated = userService.adminUpdateUser(currentAdminId, id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thông tin người dùng thành công", updated));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRole(
            @RequestHeader("X-User-Id") Long currentAdminId,
            @RequestHeader("X-User-Role") String currentUserRole,
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request) {
        requireAdmin(currentUserRole);
        UserResponse updated = userService.updateUserRole(currentAdminId, id, request.getRole());
        return ResponseEntity.ok(ApiResponse.ok("Phân quyền người dùng thành công", updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @RequestHeader("X-User-Id") Long currentAdminId,
            @RequestHeader("X-User-Role") String currentUserRole,
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request) {
        requireAdmin(currentUserRole);
        UserResponse updated = userService.updateUserStatus(currentAdminId, id, request.getActive());
        String message = Boolean.TRUE.equals(request.getActive())
                ? "Mở khóa tài khoản thành công"
                : "Khóa tài khoản thành công";
        return ResponseEntity.ok(ApiResponse.ok(message, updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @RequestHeader("X-User-Id") Long currentAdminId,
            @RequestHeader("X-User-Role") String currentUserRole,
            @PathVariable Long id) {
        requireAdmin(currentUserRole);
        userService.deleteUser(currentAdminId, id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa tài khoản người dùng thành công"));
    }

    private void requireAdmin(String role) {
        if (!Role.ADMIN.name().equalsIgnoreCase(role)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập chức năng quản trị");
        }
    }
}
