package com.foodhub.order.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class OrderStatsResponse {

    private long totalOrders;
    private BigDecimal completedRevenue;
    private Map<String, Long> ordersByStatus;
    private List<TopSellingProductDto> topSellingProducts;

    public static class TopSellingProductDto {
        private Long productId;
        private String productName;
        private long totalQuantity;
        private BigDecimal totalRevenue;

        public TopSellingProductDto() {
        }

        public TopSellingProductDto(Long productId, String productName, long totalQuantity, BigDecimal totalRevenue) {
            this.productId = productId;
            this.productName = productName;
            this.totalQuantity = totalQuantity;
            this.totalRevenue = totalRevenue;
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

        public long getTotalQuantity() {
            return totalQuantity;
        }

        public void setTotalQuantity(long totalQuantity) {
            this.totalQuantity = totalQuantity;
        }

        public BigDecimal getTotalRevenue() {
            return totalRevenue;
        }

        public void setTotalRevenue(BigDecimal totalRevenue) {
            this.totalRevenue = totalRevenue;
        }
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public BigDecimal getCompletedRevenue() {
        return completedRevenue;
    }

    public void setCompletedRevenue(BigDecimal completedRevenue) {
        this.completedRevenue = completedRevenue;
    }

    public Map<String, Long> getOrdersByStatus() {
        return ordersByStatus;
    }

    public void setOrdersByStatus(Map<String, Long> ordersByStatus) {
        this.ordersByStatus = ordersByStatus;
    }

    public List<TopSellingProductDto> getTopSellingProducts() {
        return topSellingProducts;
    }

    public void setTopSellingProducts(List<TopSellingProductDto> topSellingProducts) {
        this.topSellingProducts = topSellingProducts;
    }
}
