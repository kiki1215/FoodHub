package com.foodhub.user.repository;

import com.foodhub.user.entity.Role;
import com.foodhub.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    long countByRoleAndActiveTrue(Role role);

    @Query("""
            SELECT u FROM User u
            WHERE (:keyword IS NULL OR :keyword = ''
                   OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR (u.phone IS NOT NULL AND u.phone LIKE CONCAT('%', :keyword, '%')))
              AND (:role IS NULL OR u.role = :role)
              AND (:active IS NULL OR u.active = :active)
            ORDER BY u.createdAt DESC
            """)
    List<User> searchUsers(
            @Param("keyword") String keyword,
            @Param("role") Role role,
            @Param("active") Boolean active
    );
}
