package com.foodhub.menu.repository;

import com.foodhub.menu.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Query("""
            SELECT c FROM Category c
            WHERE (:keyword IS NULL OR :keyword = ''
                   OR LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR (c.description IS NOT NULL AND LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%'))))
            ORDER BY c.id ASC
            """)
    List<Category> searchCategories(@Param("keyword") String keyword);
}
