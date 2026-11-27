package com.foodhub.user.controller;

import com.foodhub.user.dto.ApiResponse;
import com.foodhub.user.dto.UpdateAvatarRequest;
import com.foodhub.user.dto.UpdateProfileRequest;
import com.foodhub.user.dto.UserResponse;
import com.foodhub.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMyProfile(
            @RequestHeader("X-User-Id") Long currentUserId) {
        UserResponse profile = userService.getProfile(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy thông tin hồ sơ thành công", profile));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyProfile(
            @RequestHeader("X-User-Id") Long currentUserId,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse updated = userService.updateProfile(currentUserId, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật hồ sơ cá nhân thành công", updated));
    }

    @PatchMapping("/me/avatar")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyAvatar(
            @RequestHeader("X-User-Id") Long currentUserId,
            @Valid @RequestBody UpdateAvatarRequest request) {
        UserResponse updated = userService.updateAvatar(currentUserId, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật ảnh đại diện thành công", updated));
    }
}
