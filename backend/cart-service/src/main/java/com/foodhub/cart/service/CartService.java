package com.foodhub.cart.service;

import com.foodhub.cart.dto.*;
import com.foodhub.cart.entity.CartItem;
import com.foodhub.cart.exception.AppException;
import com.foodhub.cart.repository.CartItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final MenuClient menuClient;

    public CartService(CartItemRepository cartItemRepository, MenuClient menuClient) {
        this.cartItemRepository = cartItemRepository;
        this.menuClient = menuClient;
    }

    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        List<CartItemResponse> items = cartItemRepository.findByUserIdOrderByCreatedAtAsc(userId)
                .stream()
                .map(CartItemResponse::fromEntity)
                .toList();
        return CartResponse.of(userId, items);
    }

    @Transactional
    public CartResponse addItem(Long userId, AddCartItemRequest request) {
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Số lượng món phải lớn hơn 0");
        }

        MenuProductCheckDto product = menuClient.checkProduct(request.getProductId());
        if (!product.isExists()) {
            throw new AppException(HttpStatus.NOT_FOUND, "Món ăn không tồn tại");
        }
        if (!product.isAvailable()) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Món ăn '" + product.getName() + "' hiện đã hết hàng hoặc ngừng kinh doanh");
        }

        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, request.getProductId())
                .orElseGet(() -> {
                    CartItem created = new CartItem();
                    created.setUserId(userId);
                    created.setProductId(product.getId());
                    created.setQuantity(0);
                    return created;
                });

        int newQuantity = item.getQuantity() + request.getQuantity();
        if (newQuantity > 99) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Số lượng mỗi món trong giỏ tối đa 99");
        }

        item.setProductName(product.getName());
        item.setProductImageUrl(product.getImageUrl());
        item.setUnitPrice(product.getPrice());
        item.setQuantity(newQuantity);

        cartItemRepository.save(item);
        return getCart(userId);
    }

    @Transactional
    public CartResponse updateItemQuantity(Long userId, Long productId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Số lượng món phải lớn hơn 0");
        }

        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Món ăn không có trong giỏ hàng của bạn"));

        MenuProductCheckDto product = menuClient.checkProduct(productId);
        if (!product.isExists() || !product.isAvailable()) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Món ăn hiện đã hết hàng hoặc ngừng kinh doanh, vui lòng xóa khỏi giỏ hàng");
        }

        item.setProductName(product.getName());
        item.setProductImageUrl(product.getImageUrl());
        item.setUnitPrice(product.getPrice());
        item.setQuantity(quantity);

        cartItemRepository.save(item);
        return getCart(userId);
    }

    @Transactional
    public CartResponse adjustItemQuantity(Long userId, Long productId, int delta) {
        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Món ăn không có trong giỏ hàng của bạn"));

        int newQuantity = item.getQuantity() + delta;
        if (newQuantity <= 0) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Số lượng món phải lớn hơn 0. Nếu muốn bỏ món, vui lòng xóa khỏi giỏ hàng");
        }
        if (newQuantity > 99) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Số lượng mỗi món trong giỏ tối đa 99");
        }

        return updateItemQuantity(userId, productId, newQuantity);
    }

    @Transactional
    public CartResponse removeItem(Long userId, Long productId) {
        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Món ăn không có trong giỏ hàng của bạn"));
        cartItemRepository.delete(item);
        return getCart(userId);
    }

    @Transactional
    public CartResponse clearCart(Long userId) {
        cartItemRepository.deleteByUserId(userId);
        return getCart(userId);
    }
}
