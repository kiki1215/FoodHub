package com.foodhub.order.repository;

import com.foodhub.order.entity.Order;
import com.foodhub.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByUserIdAndIdempotencyKey(Long userId, String idempotencyKey);

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Order> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, OrderStatus status);

    boolean existsByUserIdAndStatusIn(Long userId, Collection<OrderStatus> statuses);

    long countByUserIdAndStatusIn(Long userId, Collection<OrderStatus> statuses);

    long countByStatus(OrderStatus status);

    @Query("""
            SELECT COALESCE(SUM(o.totalAmount), 0)
            FROM Order o
            WHERE o.status = :status
            """)
    BigDecimal sumTotalAmountByStatus(@Param("status") OrderStatus status);

    @Query("""
            SELECT o FROM Order o
            WHERE (:orderCode IS NULL OR :orderCode = ''
                   OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :orderCode, '%')))
              AND (:status IS NULL OR o.status = :status)
            ORDER BY o.createdAt DESC
            """)
    Page<Order> searchAdminOrders(
            @Param("orderCode") String orderCode,
            @Param("status") OrderStatus status,
            Pageable pageable
    );

    @Query("""
            SELECT oi.productId, oi.productName, SUM(oi.quantity), SUM(oi.subtotal)
            FROM OrderItem oi
            JOIN oi.order o
            WHERE o.status = :status
              AND (:year IS NULL OR YEAR(o.createdAt) = :year)
              AND (:month IS NULL OR MONTH(o.createdAt) = :month)
            GROUP BY oi.productId, oi.productName
            ORDER BY SUM(oi.quantity) DESC
            """)
    List<Object[]> findTopSellingProducts(
            @Param("status") OrderStatus status,
            @Param("year") Integer year,
            @Param("month") Integer month,
            Pageable pageable
    );
}
