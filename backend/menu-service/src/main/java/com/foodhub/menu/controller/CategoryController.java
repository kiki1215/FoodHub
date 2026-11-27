package com.foodhub.menu.controller;

import com.foodhub.menu.dto.ApiResponse;
import com.foodhub.menu.dto.CategoryResponse;
import com.foodhub.menu.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> listCategories(
            @RequestParam(required = false) String keyword) {
        List<CategoryResponse> categories = categoryService.searchCategories(keyword);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách danh mục thành công", categories));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategory(@PathVariable Long id) {
        CategoryResponse category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết danh mục thành công", category));
    }
}
