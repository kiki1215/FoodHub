package com.foodhub.user.controller;

import com.foodhub.user.dto.ApiResponse;
import com.foodhub.user.entity.Role;
import com.foodhub.user.exception.AppException;
import com.foodhub.user.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/stats/users")
public class AdminUserStatsController {

    private final UserService userService;

    public AdminUserStatsController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserStats(
            @RequestHeader("X-User-Role") String role) {
        if (!Role.ADMIN.name().equalsIgnoreCase(role)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập chức năng quản trị");
        }
        return ResponseEntity.ok(ApiResponse.ok("Lấy thống kê tài khoản thành công", userService.getUserStats()));
    }
}
