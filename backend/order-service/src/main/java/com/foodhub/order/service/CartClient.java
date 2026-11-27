package com.foodhub.order.service;

import com.foodhub.order.dto.ApiResponse;
import com.foodhub.order.dto.ExternalCartDto;
import com.foodhub.order.exception.AppException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class CartClient {

    private static final Logger log = LoggerFactory.getLogger(CartClient.class);

    private final RestClient cartRestClient;

    public CartClient(RestClient cartRestClient) {
        this.cartRestClient = cartRestClient;
    }

    public ExternalCartDto getUserCart(Long userId) {
        try {
            ApiResponse<ExternalCartDto> response = cartRestClient.get()
                    .uri("/internal/cart/{userId}", userId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});

            if (response == null || !response.isSuccess() || response.getData() == null) {
                throw new AppException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Không thể lấy thông tin giỏ hàng từ Cart Service");
            }
            return response.getData();
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Lỗi gọi Cart Service lấy giỏ hàng userId={}: {}", userId, ex.getMessage());
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Dịch vụ giỏ hàng hiện không khả dụng, vui lòng thử lại sau");
        }
    }

    public void clearUserCart(Long userId) {
        try {
            cartRestClient.delete()
                    .uri("/internal/cart/{userId}", userId)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            log.warn("Đơn hàng đã tạo thành công nhưng không thể xóa giỏ hàng của userId={}: {}", userId, ex.getMessage());
        }
    }
}
