package com.foodhub.user.service;

import com.foodhub.user.dto.ApiResponse;
import com.foodhub.user.exception.AppException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class OrderClient {

    private static final Logger log = LoggerFactory.getLogger(OrderClient.class);

    private final RestClient orderRestClient;

    public OrderClient(RestClient orderRestClient) {
        this.orderRestClient = orderRestClient;
    }

    public boolean hasUnfinishedOrders(Long userId) {
        try {
            ApiResponse<Map<String, Object>> response = orderRestClient.get()
                    .uri("/internal/orders/users/{userId}/has-unfinished", userId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});

            if (response == null || !response.isSuccess() || response.getData() == null) {
                throw new AppException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Không thể kiểm tra trạng thái đơn hàng từ Order Service trước khi xóa tài khoản");
            }
            Object flag = response.getData().get("hasUnfinishedOrders");
            return Boolean.TRUE.equals(flag);
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Lỗi gọi Order Service kiểm tra đơn chưa hoàn tất của userId={}: {}", userId, ex.getMessage());
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Dịch vụ đơn hàng hiện không khả dụng, không thể xác minh điều kiện xóa tài khoản");
        }
    }
}
