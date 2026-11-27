package com.foodhub.menu.repository;

import com.foodhub.menu.entity.Product;
import com.foodhub.menu.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsByCategoryId(Long categoryId);

    long countByCategoryId(Long categoryId);

    long countByStatus(ProductStatus status);

    @EntityGraph(attributePaths = "category")
    Optional<Product> findWithCategoryById(Long id);

    @EntityGraph(attributePaths = "category")
    List<Product> findAllByIdIn(Collection<Long> ids);

    @EntityGraph(attributePaths = "category")
    @Query("""
            SELECT p FROM Product p
            WHERE (:keyword IS NULL OR :keyword = ''
                   OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR (p.description IS NOT NULL AND LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))))
              AND (:categoryId IS NULL OR p.category.id = :categoryId)
              AND (:status IS NULL OR p.status = :status)
            """)
    Page<Product> searchProducts(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("status") ProductStatus status,
            Pageable pageable
    );

    @EntityGraph(attributePaths = "category")
    @Query("""
            SELECT p FROM Product p
            WHERE p.status = :status
            ORDER BY p.soldCount DESC, p.id ASC
            """)
    List<Product> findBestSellers(@Param("status") ProductStatus status, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    @Query("""
            SELECT p FROM Product p
            WHERE p.status = :status
              AND (UPPER(p.mealTimeTag) = UPPER(:timeSlot) OR UPPER(p.mealTimeTag) = 'ALL_DAY')
            ORDER BY CASE WHEN UPPER(p.mealTimeTag) = UPPER(:timeSlot) THEN 0 ELSE 1 END,
                     p.soldCount DESC,
                     p.id ASC
            """)
    List<Product> findBestSellersByTimeSlot(
            @Param("status") ProductStatus status,
            @Param("timeSlot") String timeSlot,
            Pageable pageable
    );
}
