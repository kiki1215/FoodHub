package com.foodhub.menu.dto;

import com.foodhub.menu.entity.Product;
import com.foodhub.menu.entity.ProductStatus;
import java.math.BigDecimal;

public class ProductCheckResponse {

    private Long id;
    private boolean exists;
    private boolean available;
    private String name;
    private BigDecimal price;
    private String imageUrl;
    private Long categoryId;
    private String categoryName;
    private ProductStatus status;

    public static ProductCheckResponse notFound(Long id) {
        ProductCheckResponse res = new ProductCheckResponse();
        res.setId(id);
        res.setExists(false);
        res.setAvailable(false);
        return res;
    }

    public static ProductCheckResponse fromEntity(Product product) {
        ProductCheckResponse res = new ProductCheckResponse();
        res.setId(product.getId());
        res.setExists(true);
        res.setAvailable(product.getStatus() == ProductStatus.AVAILABLE);
        res.setName(product.getName());
        res.setPrice(product.getPrice());
        res.setImageUrl(product.getImageUrl());
        if (product.getCategory() != null) {
            res.setCategoryId(product.getCategory().getId());
            res.setCategoryName(product.getCategory().getName());
        }
        res.setStatus(product.getStatus());
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public boolean isExists() {
        return exists;
    }

    public void setExists(boolean exists) {
        this.exists = exists;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public ProductStatus getStatus() {
        return status;
    }

    public void setStatus(ProductStatus status) {
        this.status = status;
    }
}
