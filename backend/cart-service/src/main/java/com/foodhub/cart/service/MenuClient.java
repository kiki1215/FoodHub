package com.foodhub.cart.service;

import com.foodhub.cart.dto.ApiResponse;
import com.foodhub.cart.dto.MenuProductCheckDto;
import com.foodhub.cart.exception.AppException;
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

    public MenuProductCheckDto checkProduct(Long productId) {
        try {
            ApiResponse<MenuProductCheckDto> response = menuRestClient.get()
                    .uri("/internal/products/{id}/check", productId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});

            if (response == null || !response.isSuccess() || response.getData() == null) {
                throw new AppException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Không thể xác thực thông tin món ăn từ Menu Service");
            }
            return response.getData();
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Lỗi gọi Menu Service để kiểm tra món ăn id={}: {}", productId, ex.getMessage());
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Dịch vụ thực đơn hiện không khả dụng, vui lòng thử lại sau");
        }
    }
}
