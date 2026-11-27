package com.foodhub.menu.service;

import com.foodhub.menu.dto.*;
import com.foodhub.menu.entity.Category;
import com.foodhub.menu.entity.Product;
import com.foodhub.menu.entity.ProductStatus;
import com.foodhub.menu.exception.AppException;
import com.foodhub.menu.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Service
public class ProductService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "name", "price", "soldCount", "createdAt", "updatedAt");
    private static final Set<String> VALID_TIME_SLOTS = Set.of("MORNING", "LUNCH", "AFTERNOON", "DINNER", "ALL_DAY");

    private final ProductRepository productRepository;
    private final CategoryService categoryService;

    public ProductService(ProductRepository productRepository, CategoryService categoryService) {
        this.productRepository = productRepository;
        this.categoryService = categoryService;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> searchProducts(
            String keyword,
            Long categoryId,
            ProductStatus status,
            int page,
            int size,
            String sortBy,
            String sortDir) {

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        String safeSortBy = (sortBy != null && ALLOWED_SORT_FIELDS.contains(sortBy)) ? sortBy : "createdAt";
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(direction, safeSortBy));
        String trimmedKeyword = keyword != null ? keyword.trim() : null;

        Page<ProductResponse> resultPage = productRepository
                .searchProducts(trimmedKeyword, categoryId, status, pageable)
                .map(ProductResponse::fromEntity);

        return PageResponse.fromPage(resultPage);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findWithCategoryById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy món ăn"));
        return ProductResponse.fromEntity(product);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getBestSellers(int limit, String timeSlot) {
        int safeLimit = Math.min(Math.max(limit, 1), 20);
        Pageable pageable = PageRequest.of(0, safeLimit);

        List<Product> products;
        if (timeSlot != null && !timeSlot.isBlank()) {
            String resolvedSlot = resolveTimeSlot(timeSlot.trim());
            products = productRepository.findBestSellersByTimeSlot(ProductStatus.AVAILABLE, resolvedSlot, pageable);
        } else {
            products = productRepository.findBestSellers(ProductStatus.AVAILABLE, pageable);
        }

        return products.stream().map(ProductResponse::fromEntity).toList();
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Category category = categoryService.findOrThrow(request.getCategoryId());

        Product product = new Product();
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        product.setPrice(request.getPrice());
        product.setImageUrl(request.getImageUrl() != null ? request.getImageUrl().trim() : null);
        product.setCategory(category);
        product.setStatus(request.getStatus() != null ? request.getStatus() : ProductStatus.AVAILABLE);
        product.setMealTimeTag(normalizeMealTimeTag(request.getMealTimeTag()));
        product.setSoldCount(0L);

        Product saved = productRepository.save(product);
        return ProductResponse.fromEntity(saved);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findWithCategoryById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy món ăn"));
        Category category = categoryService.findOrThrow(request.getCategoryId());

        product.setName(request.getName().trim());
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription().trim());
        }
        product.setPrice(request.getPrice());
        if (request.getImageUrl() != null) {
            product.setImageUrl(request.getImageUrl().trim());
        }
        product.setCategory(category);
        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
        }
        if (request.getMealTimeTag() != null && !request.getMealTimeTag().isBlank()) {
            product.setMealTimeTag(normalizeMealTimeTag(request.getMealTimeTag()));
        }

        Product updated = productRepository.save(product);
        return ProductResponse.fromEntity(updated);
    }

    @Transactional
    public ProductResponse updateProductStatus(Long id, ProductStatus status) {
        Product product = productRepository.findWithCategoryById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy món ăn"));
        product.setStatus(status);
        return ProductResponse.fromEntity(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy món ăn"));
        productRepository.delete(product);
    }

    // ==================== INTERNAL SERVICE-TO-SERVICE METHODS ====================

    @Transactional(readOnly = true)
    public ProductCheckResponse checkProduct(Long id) {
        return productRepository.findWithCategoryById(id)
                .map(ProductCheckResponse::fromEntity)
                .orElseGet(() -> ProductCheckResponse.notFound(id));
    }

    @Transactional(readOnly = true)
    public boolean existsById(Long id) {
        return productRepository.existsById(id);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsByIds(List<Long> ids) {
        return productRepository.findAllByIdIn(ids)
                .stream()
                .map(ProductResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ProductResponse incrementSoldCount(Long id, long quantity) {
        if (quantity <= 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Số lượng tăng lượt bán phải lớn hơn 0");
        }
        Product product = productRepository.findWithCategoryById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy món ăn"));
        product.setSoldCount(product.getSoldCount() + quantity);
        return ProductResponse.fromEntity(productRepository.save(product));
    }

    private String resolveTimeSlot(String rawTimeSlot) {
        String upper = rawTimeSlot.toUpperCase();
        if ("CURRENT".equals(upper)) {
            int hour = LocalTime.now().getHour();
            if (hour >= 5 && hour < 11) {
                return "MORNING";
            } else if (hour >= 11 && hour < 14) {
                return "LUNCH";
            } else if (hour >= 14 && hour < 18) {
                return "AFTERNOON";
            } else {
                return "DINNER";
            }
        }
        return VALID_TIME_SLOTS.contains(upper) ? upper : "ALL_DAY";
    }

    private String normalizeMealTimeTag(String tag) {
        if (tag == null || tag.isBlank()) {
            return "ALL_DAY";
        }
        String upper = tag.trim().toUpperCase();
        return VALID_TIME_SLOTS.contains(upper) ? upper : "ALL_DAY";
    }
}
