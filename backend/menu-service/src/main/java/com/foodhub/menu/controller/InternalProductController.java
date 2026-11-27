package com.foodhub.menu.controller;

import com.foodhub.menu.dto.ApiResponse;
import com.foodhub.menu.dto.BatchProductRequest;
import com.foodhub.menu.dto.ProductCheckResponse;
import com.foodhub.menu.dto.ProductResponse;
import com.foodhub.menu.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Các API nội bộ chỉ dùng cho giao tiếp service-to-service trong mạng Docker (Cart, Order, AI).
 * KHÔNG định tuyến /internal/** qua API Gateway.
 */
@RestController
@RequestMapping("/internal/products")
public class InternalProductController {

    private final ProductService productService;

    public InternalProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/{id}/check")
    public ResponseEntity<ApiResponse<ProductCheckResponse>> checkProduct(@PathVariable Long id) {
        ProductCheckResponse result = productService.checkProduct(id);
        return ResponseEntity.ok(ApiResponse.ok("Kiểm tra thông tin món ăn thành công", result));
    }

    @GetMapping("/{id}/exists")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkProductExists(@PathVariable Long id) {
        boolean exists = productService.existsById(id);
        return ResponseEntity.ok(ApiResponse.ok("Kiểm tra tồn tại món ăn thành công",
                Map.of("id", id, "exists", exists)));
    }

    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProductsBatch(
            @Valid @RequestBody BatchProductRequest request) {
        List<ProductResponse> products = productService.getProductsByIds(request.getIds());
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách món ăn theo ID thành công", products));
    }

    @GetMapping("/best-sellers")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getBestSellers(
            @RequestParam(defaultValue = "8") int limit,
            @RequestParam(required = false) String timeSlot) {
        List<ProductResponse> products = productService.getBestSellers(limit, timeSlot);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách món bán chạy thành công", products));
    }

    @PatchMapping("/{id}/sold-count")
    public ResponseEntity<ApiResponse<ProductResponse>> incrementSoldCount(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") long quantity) {
        ProductResponse updated = productService.incrementSoldCount(id, quantity);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật số lượt bán thành công", updated));
    }
}
