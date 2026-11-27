package com.foodhub.order.service;

import com.foodhub.order.dto.ApiResponse;
import com.foodhub.order.dto.ExternalMenuProductDto;
import com.foodhub.order.exception.AppException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class MenuClient {

    private static final Logger log = LoggerFactory.getLogger(MenuClient.class);

    private final RestClient menuRestClient;

    public MenuClient(RestClient menuRestClient) {
        this.menuRestClient = menuRestClient;
    }

    public ExternalMenuProductDto checkProduct(Long productId) {
        try {
            ApiResponse<ExternalMenuProductDto> response = menuRestClient.get()
                    .uri("/internal/products/{id}/check", productId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});

            if (response == null || !response.isSuccess() || response.getData() == null) {
                throw new AppException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Không thể đối chiếu giá món ăn từ Menu Service");
            }
            return response.getData();
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Lỗi gọi Menu Service kiểm tra món id={}: {}", productId, ex.getMessage());
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Dịch vụ thực đơn hiện không khả dụng, vui lòng thử lại sau");
        }
    }

    public void incrementSoldCount(Long productId, int quantity) {
        try {
            menuRestClient.patch()
                    .uri(uriBuilder -> uriBuilder
                            .path("/internal/products/{id}/sold-count")
                            .queryParam("quantity", quantity)
                            .build(productId))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            log.warn("Không thể cập nhật số lượt bán cho productId={}: {}", productId, ex.getMessage());
        }
    }
}
