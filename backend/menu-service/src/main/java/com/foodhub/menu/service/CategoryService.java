package com.foodhub.menu.service;

import com.foodhub.menu.dto.CategoryRequest;
import com.foodhub.menu.dto.CategoryResponse;
import com.foodhub.menu.entity.Category;
import com.foodhub.menu.exception.AppException;
import com.foodhub.menu.repository.CategoryRepository;
import com.foodhub.menu.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> searchCategories(String keyword) {
        String trimmed = keyword != null ? keyword.trim() : null;
        return categoryRepository.searchCategories(trimmed)
                .stream()
                .map(c -> CategoryResponse.fromEntity(c, productRepository.countByCategoryId(c.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        Category category = findOrThrow(id);
        return CategoryResponse.fromEntity(category, productRepository.countByCategoryId(id));
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String name = request.getName().trim();
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new AppException(HttpStatus.CONFLICT, "Tên danh mục đã tồn tại trong hệ thống");
        }

        Category category = new Category();
        category.setName(name);
        category.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);

        Category saved = categoryRepository.save(category);
        return CategoryResponse.fromEntity(saved, 0L);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = findOrThrow(id);
        String name = request.getName().trim();
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new AppException(HttpStatus.CONFLICT, "Tên danh mục đã tồn tại trong hệ thống");
        }

        category.setName(name);
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription().trim());
        }

        Category updated = categoryRepository.save(category);
        return CategoryResponse.fromEntity(updated, productRepository.countByCategoryId(id));
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = findOrThrow(id);
        if (productRepository.existsByCategoryId(id)) {
            throw new AppException(HttpStatus.CONFLICT,
                    "Không thể xóa danh mục đang chứa món ăn. Vui lòng chuyển hoặc xóa các món ăn thuộc danh mục này trước");
        }
        categoryRepository.delete(category);
    }

    public Category findOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy danh mục"));
    }
}
