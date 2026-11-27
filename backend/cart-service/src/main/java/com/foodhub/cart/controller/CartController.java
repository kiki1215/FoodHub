package com.foodhub.cart.controller;

import com.foodhub.cart.dto.AddCartItemRequest;
import com.foodhub.cart.dto.ApiResponse;
import com.foodhub.cart.dto.CartResponse;
import com.foodhub.cart.dto.UpdateCartItemRequest;
import com.foodhub.cart.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getMyCart(
            @RequestHeader("X-User-Id") Long currentUserId) {
        CartResponse cart = cartService.getCart(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy thông tin giỏ hàng thành công", cart));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(
            @RequestHeader("X-User-Id") Long currentUserId,
            @Valid @RequestBody AddCartItemRequest request) {
        CartResponse cart = cartService.addItem(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Thêm món vào giỏ hàng thành công", cart));
    }

    @PutMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateItem(
            @RequestHeader("X-User-Id") Long currentUserId,
            @PathVariable Long productId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        CartResponse cart = cartService.updateItemQuantity(currentUserId, productId, request.getQuantity());
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật số lượng món thành công", cart));
    }

    @PatchMapping("/items/{productId}/increase")
    public ResponseEntity<ApiResponse<CartResponse>> increaseItem(
            @RequestHeader("X-User-Id") Long currentUserId,
            @PathVariable Long productId) {
        CartResponse cart = cartService.adjustItemQuantity(currentUserId, productId, 1);
        return ResponseEntity.ok(ApiResponse.ok("Tăng số lượng món thành công", cart));
    }

    @PatchMapping("/items/{productId}/decrease")
    public ResponseEntity<ApiResponse<CartResponse>> decreaseItem(
            @RequestHeader("X-User-Id") Long currentUserId,
            @PathVariable Long productId) {
        CartResponse cart = cartService.adjustItemQuantity(currentUserId, productId, -1);
        return ResponseEntity.ok(ApiResponse.ok("Giảm số lượng món thành công", cart));
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(
            @RequestHeader("X-User-Id") Long currentUserId,
            @PathVariable Long productId) {
        CartResponse cart = cartService.removeItem(currentUserId, productId);
        return ResponseEntity.ok(ApiResponse.ok("Xóa món khỏi giỏ hàng thành công", cart));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<CartResponse>> clearCart(
            @RequestHeader("X-User-Id") Long currentUserId) {
        CartResponse cart = cartService.clearCart(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa toàn bộ giỏ hàng", cart));
    }
}
