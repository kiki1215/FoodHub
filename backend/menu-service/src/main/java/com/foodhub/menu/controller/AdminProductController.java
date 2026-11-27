package com.foodhub.menu.controller;

import com.foodhub.menu.dto.*;
import com.foodhub.menu.exception.AppException;
import com.foodhub.menu.service.FileStorageService;
import com.foodhub.menu.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    private final ProductService productService;
    private final FileStorageService fileStorageService;

    public AdminProductController(ProductService productService, FileStorageService fileStorageService) {
        this.productService = productService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @RequestHeader("X-User-Role") String role,
            @Valid @RequestBody ProductRequest request) {
        requireAdmin(role);
        ProductResponse created = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Thêm món ăn thành công", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @RequestHeader("X-User-Role") String role,
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        requireAdmin(role);
        ProductResponse updated = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật món ăn thành công", updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProductStatus(
            @RequestHeader("X-User-Role") String role,
            @PathVariable Long id,
            @Valid @RequestBody ProductStatusUpdateRequest request) {
        requireAdmin(role);
        ProductResponse updated = productService.updateProductStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái kinh doanh thành công", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @RequestHeader("X-User-Role") String role,
            @PathVariable Long id) {
        requireAdmin(role);
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa món ăn thành công"));
    }

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ImageUploadResponse>> uploadImage(
            @RequestHeader("X-User-Role") String role,
            @RequestPart("file") MultipartFile file) {
        requireAdmin(role);
        ImageUploadResponse uploaded = fileStorageService.storeImage(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tải lên hình ảnh thành công", uploaded));
    }

    private void requireAdmin(String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập chức năng quản trị");
        }
    }
}
