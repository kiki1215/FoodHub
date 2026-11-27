package com.foodhub.cart.controller;

import com.foodhub.cart.dto.ApiResponse;
import com.foodhub.cart.dto.CartResponse;
import com.foodhub.cart.service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * API nội bộ chỉ dùng cho Order Service trong mạng Docker.
 * KHÔNG định tuyến qua API Gateway.
 */
@RestController
@RequestMapping("/internal/cart")
public class InternalCartController {

    private final CartService cartService;

    public InternalCartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<CartResponse>> getUserCart(@PathVariable Long userId) {
        CartResponse cart = cartService.getCart(userId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy giỏ hàng nội bộ thành công", cart));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> clearUserCart(@PathVariable Long userId) {
        cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa giỏ hàng nội bộ thành công"));
    }
}
