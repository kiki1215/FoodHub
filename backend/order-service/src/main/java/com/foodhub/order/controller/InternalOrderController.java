package com.foodhub.order.controller;

import com.foodhub.order.dto.ApiResponse;
import com.foodhub.order.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * API nội bộ chỉ dùng cho giao tiếp service-to-service (User Service kiểm tra ràng buộc xóa tài khoản).
 * KHÔNG định tuyến qua API Gateway.
 */
@RestController
@RequestMapping("/internal/orders")
public class InternalOrderController {

    private final OrderService orderService;

    public InternalOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/users/{userId}/has-unfinished")
    public ResponseEntity<ApiResponse<Map<String, Object>>> hasUnfinishedOrders(@PathVariable Long userId) {
        Map<String, Object> result = orderService.checkUserUnfinishedOrders(userId);
        return ResponseEntity.ok(ApiResponse.ok("Kiểm tra đơn hàng chưa hoàn tất thành công", result));
    }
}
