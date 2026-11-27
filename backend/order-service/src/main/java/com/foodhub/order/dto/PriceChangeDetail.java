package com.foodhub.order.dto;

import java.math.BigDecimal;

public class PriceChangeDetail {

    private Long productId;
    private String productName;
    private BigDecimal oldPrice;
    private BigDecimal newPrice;

    public PriceChangeDetail() {
    }

    public PriceChangeDetail(Long productId, String productName, BigDecimal oldPrice, BigDecimal newPrice) {
        this.productId = productId;
        this.productName = productName;
        this.oldPrice = oldPrice;
        this.newPrice = newPrice;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public BigDecimal getOldPrice() {
        return oldPrice;
    }

    public void setOldPrice(BigDecimal oldPrice) {
        this.oldPrice = oldPrice;
    }

    public BigDecimal getNewPrice() {
        return newPrice;
    }

    public void setNewPrice(BigDecimal newPrice) {
        this.newPrice = newPrice;
    }
}
