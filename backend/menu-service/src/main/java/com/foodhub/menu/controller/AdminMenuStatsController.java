package com.foodhub.menu.controller;

import com.foodhub.menu.dto.ApiResponse;
import com.foodhub.menu.exception.AppException;
import com.foodhub.menu.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/stats/menu")
public class AdminMenuStatsController {

    private final ProductService productService;

    public AdminMenuStatsController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMenuStats(
            @RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập chức năng quản trị");
        }
        return ResponseEntity.ok(ApiResponse.ok("Lấy thống kê thực đơn thành công", productService.getMenuStats()));
    }
}
