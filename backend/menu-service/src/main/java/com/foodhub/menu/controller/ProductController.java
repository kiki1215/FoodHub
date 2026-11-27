package com.foodhub.menu.controller;

import com.foodhub.menu.dto.ApiResponse;
import com.foodhub.menu.dto.PageResponse;
import com.foodhub.menu.dto.ProductResponse;
import com.foodhub.menu.entity.ProductStatus;
import com.foodhub.menu.service.FileStorageService;
import com.foodhub.menu.service.ProductService;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final FileStorageService fileStorageService;

    public ProductController(ProductService productService, FileStorageService fileStorageService) {
        this.productService = productService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> listProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        PageResponse<ProductResponse> products = productService.searchProducts(
                keyword, categoryId, status, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách món ăn thành công", products));
    }

    @GetMapping("/best-sellers")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getBestSellers(
            @RequestParam(defaultValue = "8") int limit,
            @RequestParam(required = false) String timeSlot) {
        List<ProductResponse> bestSellers = productService.getBestSellers(limit, timeSlot);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách món bán chạy thành công", bestSellers));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProduct(@PathVariable Long id) {
        ProductResponse product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết món ăn thành công", product));
    }

    @GetMapping("/images/{fileName:.+}")
    public ResponseEntity<Resource> serveImage(@PathVariable String fileName) {
        Resource resource = fileStorageService.loadImageAsResource(fileName);
        String contentType = fileStorageService.detectContentType(fileName);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic())
                .body(resource);
    }
}
