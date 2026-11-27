package com.foodhub.order.controller;

import com.foodhub.order.dto.ApiResponse;
import com.foodhub.order.dto.CreateOrderRequest;
import com.foodhub.order.dto.OrderResponse;
import com.foodhub.order.entity.OrderStatus;
import com.foodhub.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody CreateOrderRequest request) {

        OrderService.CreateOrderResult result = orderService.createOrder(currentUserId, idempotencyKey, request);
        if (result.replayed()) {
            return ResponseEntity.ok(
                    ApiResponse.ok("Đơn hàng đã được tạo trước đó (trả lại kết quả theo Idempotency-Key)", result.order()));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Đặt hàng thành công", result.order()));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestParam(required = false) OrderStatus status) {
        List<OrderResponse> orders = orderService.getMyOrders(currentUserId, status);
        return ResponseEntity.ok(ApiResponse.ok("Lấy lịch sử đặt hàng thành công", orders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderDetail(
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader("X-User-Role") String currentUserRole,
            @PathVariable Long id) {
        OrderResponse order = orderService.getOrderDetailForUser(id, currentUserId, currentUserRole);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết đơn hàng thành công", order));
    }
}
