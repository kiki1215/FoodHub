package com.foodhub.menu.dto;

import com.foodhub.menu.entity.ProductStatus;
import jakarta.validation.constraints.NotNull;

public class ProductStatusUpdateRequest {

    @NotNull(message = "Trạng thái kinh doanh không được để trống (AVAILABLE, OUT_OF_STOCK, STOPPED)")
    private ProductStatus status;

    public ProductStatus getStatus() {
        return status;
    }

    public void setStatus(ProductStatus status) {
        this.status = status;
    }
}
