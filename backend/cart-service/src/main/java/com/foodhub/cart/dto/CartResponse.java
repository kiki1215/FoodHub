package com.foodhub.cart.dto;

import java.math.BigDecimal;
import java.util.List;

public class CartResponse {

    private Long userId;
    private List<CartItemResponse> items;
    private int totalItems;
    private int totalQuantity;
    private BigDecimal totalAmount;

    public static CartResponse of(Long userId, List<CartItemResponse> items) {
        CartResponse res = new CartResponse();
        res.setUserId(userId);
        res.setItems(items);
        res.setTotalItems(items.size());
        res.setTotalQuantity(items.stream().mapToInt(CartItemResponse::getQuantity).sum());
        res.setTotalAmount(items.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        return res;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public List<CartItemResponse> getItems() {
        return items;
    }

    public void setItems(List<CartItemResponse> items) {
        this.items = items;
    }

    public int getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(int totalItems) {
        this.totalItems = totalItems;
    }

    public int getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(int totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
}
