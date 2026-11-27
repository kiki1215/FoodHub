package com.foodhub.order.controller;

import com.foodhub.order.dto.*;
import com.foodhub.order.entity.OrderStatus;
import com.foodhub.order.exception.AppException;
import com.foodhub.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/api/admin/orders")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> listOrders(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(required = false) String orderCode,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        requireAdmin(role);
        PageResponse<OrderResponse> result = orderService.searchAdminOrders(orderCode, status, page, size);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách đơn hàng thành công", result));
    }

    @GetMapping("/api/admin/orders/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderDetail(
            @RequestHeader("X-User-Role") String role,
            @PathVariable Long id) {
        requireAdmin(role);
        OrderResponse order = orderService.getAdminOrderDetail(id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết đơn hàng thành công", order));
    }

    @PatchMapping("/api/admin/orders/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @RequestHeader("X-User-Role") String role,
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        requireAdmin(role);
        OrderResponse updated = orderService.updateOrderStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái đơn hàng thành công", updated));
    }

    @GetMapping("/api/admin/stats/orders")
    public ResponseEntity<ApiResponse<OrderStatsResponse>> getOrderStats(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(defaultValue = "5") int topLimit) {
        requireAdmin(role);
        OrderStatsResponse stats = orderService.getOrderStats(year, month, topLimit);
        return ResponseEntity.ok(ApiResponse.ok("Lấy thống kê đơn hàng và doanh thu thành công", stats));
    }

    private void requireAdmin(String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập chức năng quản trị");
        }
    }
}
