package com.foodhub.menu.dto;

import com.foodhub.menu.entity.ProductStatus;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class ProductRequest {

    @NotBlank(message = "Tên món ăn không được để trống")
    @Size(min = 2, max = 150, message = "Tên món ăn phải từ 2 đến 150 ký tự")
    private String name;

    @Size(max = 2000, message = "Mô tả món ăn tối đa 2000 ký tự")
    private String description;

    @NotNull(message = "Giá bán không được để trống")
    @DecimalMin(value = "1000", message = "Giá bán phải từ 1.000 VNĐ trở lên")
    @DecimalMax(value = "100000000", message = "Giá bán không hợp lệ")
    private BigDecimal price;

    @Size(max = 500, message = "Đường dẫn hình ảnh tối đa 500 ký tự")
    private String imageUrl;

    @NotNull(message = "Danh mục món ăn không được để trống")
    private Long categoryId;

    private ProductStatus status = ProductStatus.AVAILABLE;

    @Size(max = 30, message = "Nhãn khung giờ tối đa 30 ký tự")
    private String mealTimeTag;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public ProductStatus getStatus() {
        return status;
    }

    public void setStatus(ProductStatus status) {
        this.status = status;
    }

    public String getMealTimeTag() {
        return mealTimeTag;
    }

    public void setMealTimeTag(String mealTimeTag) {
        this.mealTimeTag = mealTimeTag;
    }
}
