package com.foodhub.order.service;

import com.foodhub.order.dto.*;
import com.foodhub.order.entity.Order;
import com.foodhub.order.entity.OrderItem;
import com.foodhub.order.entity.OrderStatus;
import com.foodhub.order.entity.PaymentMethod;
import com.foodhub.order.exception.AppException;
import com.foodhub.order.repository.OrderRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class OrderService {

    private static final DateTimeFormatter CODE_DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final OrderRepository orderRepository;
    private final CartClient cartClient;
    private final MenuClient menuClient;

    public OrderService(OrderRepository orderRepository, CartClient cartClient, MenuClient menuClient) {
        this.orderRepository = orderRepository;
        this.cartClient = cartClient;
        this.menuClient = menuClient;
    }

    public record CreateOrderResult(OrderResponse order, boolean replayed) {}

    @Transactional
    public CreateOrderResult createOrder(Long userId, String rawIdempotencyKey, CreateOrderRequest request) {
        String idempotencyKey = (rawIdempotencyKey != null && !rawIdempotencyKey.isBlank())
                ? rawIdempotencyKey.trim()
                : null;
        if (idempotencyKey != null && idempotencyKey.length() > 120) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Header Idempotency-Key tối đa 120 ký tự");
        }

        String requestHash = computeRequestHash(request);

        // Kiểm tra Idempotency-Key chống tạo đơn trùng
        if (idempotencyKey != null) {
            Optional<Order> existingOpt = orderRepository.findByUserIdAndIdempotencyKey(userId, idempotencyKey);
            if (existingOpt.isPresent()) {
                Order existing = existingOpt.get();
                if (Objects.equals(existing.getRequestHash(), requestHash)) {
                    return new CreateOrderResult(OrderResponse.fromEntity(existing), true);
                }
                throw new AppException(HttpStatus.CONFLICT,
                        "Idempotency-Key đã được sử dụng cho một yêu cầu đặt hàng khác");
            }
        }

        // Bước 2: Lấy giỏ hàng từ Cart Service
        ExternalCartDto cart = cartClient.getUserCart(userId);
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Giỏ hàng đang trống, vui lòng thêm món ăn trước khi đặt hàng");
        }

        // Bước 3 & 4: Đối chiếu giá & trạng thái từng món từ Menu Service, tính lại tổng tiền tại Backend
        List<PriceChangeDetail> priceChanges = new ArrayList<>();
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (ExternalCartDto.ExternalCartItemDto cartItem : cart.getItems()) {
            if (cartItem.getQuantity() == null || cartItem.getQuantity() <= 0) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Số lượng món trong giỏ hàng không hợp lệ");
            }

            ExternalMenuProductDto latestProduct = menuClient.checkProduct(cartItem.getProductId());
            if (!latestProduct.isExists()) {
                throw new AppException(HttpStatus.BAD_REQUEST,
                        "Món ăn '" + cartItem.getProductName() + "' không còn tồn tại trong thực đơn");
            }
            if (!latestProduct.isAvailable()) {
                throw new AppException(HttpStatus.BAD_REQUEST,
                        "Món ăn '" + latestProduct.getName() + "' hiện đã hết hàng hoặc ngừng kinh doanh, vui lòng cập nhật lại giỏ hàng");
            }

            BigDecimal cartPrice = cartItem.getUnitPrice() != null ? cartItem.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal currentPrice = latestProduct.getPrice();
            if (cartPrice.compareTo(currentPrice) != 0) {
                priceChanges.add(new PriceChangeDetail(
                        latestProduct.getId(),
                        latestProduct.getName(),
                        cartPrice,
                        currentPrice
                ));
            }

            BigDecimal subtotal = currentPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            totalAmount = totalAmount.add(subtotal);

            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(latestProduct.getId());
            orderItem.setProductName(latestProduct.getName());
            orderItem.setProductImageUrl(latestProduct.getImageUrl());
            orderItem.setUnitPrice(currentPrice);
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setSubtotal(subtotal);
            orderItems.add(orderItem);
        }

        // Nếu giá món thay đổi so với giỏ hàng và khách chưa xác nhận lại -> trả 409 kèm giá mới, KHÔNG xóa giỏ hàng
        if (!priceChanges.isEmpty() && !Boolean.TRUE.equals(request.getConfirmPriceChange())) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "Giá của một số món ăn đã thay đổi so với giỏ hàng. Vui lòng kiểm tra giá mới và gửi lại với confirmPriceChange=true để xác nhận đặt hàng",
                    Map.of(
                            "priceChanges", priceChanges,
                            "newTotalAmount", totalAmount
                    )
            );
        }

        // Bước 5: Lưu đơn hàng và snapshot món ăn trong order_db
        Order order = new Order();
        order.setOrderCode(generateOrderCode());
        order.setUserId(userId);
        order.setReceiverName(request.getReceiverName().trim());
        order.setReceiverPhone(request.getReceiverPhone().trim());
        order.setShippingAddress(request.getShippingAddress().trim());
        order.setNote(request.getNote() != null ? request.getNote().trim() : null);
        order.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.COD);
        order.setStatus(OrderStatus.PENDING);
        order.setTotalAmount(totalAmount);
        order.setIdempotencyKey(idempotencyKey);
        order.setRequestHash(requestHash);

        for (OrderItem item : orderItems) {
            order.addItem(item);
        }

        Order savedOrder;
        try {
            savedOrder = orderRepository.saveAndFlush(order);
        } catch (DataIntegrityViolationException ex) {
            // Xử lý race condition khi 2 request cùng Idempotency-Key tới đồng thời
            if (idempotencyKey != null) {
                Optional<Order> concurrent = orderRepository.findByUserIdAndIdempotencyKey(userId, idempotencyKey);
                if (concurrent.isPresent()) {
                    Order existing = concurrent.get();
                    if (Objects.equals(existing.getRequestHash(), requestHash)) {
                        return new CreateOrderResult(OrderResponse.fromEntity(existing), true);
                    }
                    throw new AppException(HttpStatus.CONFLICT,
                            "Idempotency-Key đã được sử dụng cho một yêu cầu đặt hàng khác");
                }
            }
            throw new AppException(HttpStatus.CONFLICT, "Không thể tạo đơn hàng do xung đột dữ liệu, vui lòng thử lại");
        }

        // Bước 6: CHỈ xóa giỏ hàng và cập nhật lượt bán SAU KHI đơn được lưu thành công
        cartClient.clearUserCart(userId);
        for (OrderItem item : savedOrder.getItems()) {
            menuClient.incrementSoldCount(item.getProductId(), item.getQuantity());
        }

        return new CreateOrderResult(OrderResponse.fromEntity(savedOrder), false);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(Long userId, OrderStatus status) {
        List<Order> orders = (status != null)
                ? orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, status)
                : orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return orders.stream().map(OrderResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderDetailForUser(Long orderId, Long currentUserId, String currentUserRole) {
        Order order = findOrThrow(orderId);
        boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUserRole);
        if (!isAdmin && !order.getUserId().equals(currentUserId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem đơn hàng của người dùng khác");
        }
        return OrderResponse.fromEntity(order);
    }

    // ==================== ADMIN METHODS ====================

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> searchAdminOrders(String orderCode, OrderStatus status, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(safePage, safeSize);
        String trimmedCode = orderCode != null ? orderCode.trim() : null;

        Page<OrderResponse> result = orderRepository.searchAdminOrders(trimmedCode, status, pageable)
                .map(OrderResponse::fromEntity);
        return PageResponse.fromPage(result);
    }

    @Transactional(readOnly = true)
    public OrderResponse getAdminOrderDetail(Long orderId) {
        return OrderResponse.fromEntity(findOrThrow(orderId));
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = findOrThrow(orderId);
        OrderStatus currentStatus = order.getStatus();

        if (!currentStatus.canTransitionTo(newStatus)) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Không thể chuyển trạng thái đơn hàng từ " + currentStatus + " sang " + newStatus);
        }

        order.setStatus(newStatus);
        return OrderResponse.fromEntity(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public OrderStatsResponse getOrderStats(Integer year, Integer month, int topLimit) {
        OrderStatsResponse stats = new OrderStatsResponse();
        stats.setTotalOrders(orderRepository.count());
        stats.setCompletedRevenue(orderRepository.sumTotalAmountByStatus(OrderStatus.COMPLETED));

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            byStatus.put(status.name(), orderRepository.countByStatus(status));
        }
        stats.setOrdersByStatus(byStatus);

        int safeTopLimit = Math.min(Math.max(topLimit, 1), 20);
        List<Object[]> rawTop = orderRepository.findTopSellingProducts(
                OrderStatus.COMPLETED, year, month, PageRequest.of(0, safeTopLimit));
        List<OrderStatsResponse.TopSellingProductDto> topProducts = rawTop.stream()
                .map(row -> new OrderStatsResponse.TopSellingProductDto(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).longValue(),
                        (BigDecimal) row[3]
                ))
                .toList();
        stats.setTopSellingProducts(topProducts);

        return stats;
    }

    // ==================== INTERNAL METHODS ====================

    @Transactional(readOnly = true)
    public Map<String, Object> checkUserUnfinishedOrders(Long userId) {
        long count = orderRepository.countByUserIdAndStatusIn(userId, OrderStatus.UNFINISHED_STATUSES);
        return Map.of(
                "userId", userId,
                "hasUnfinishedOrders", count > 0,
                "unfinishedOrderCount", count
        );
    }

    private Order findOrThrow(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
    }

    private String generateOrderCode() {
        String datePart = LocalDateTime.now().format(CODE_DATE_FMT);
        String randPart = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "FH-" + datePart + "-" + randPart;
    }

    private String computeRequestHash(CreateOrderRequest req) {
        String canonical = String.join("|",
                safeTrim(req.getReceiverName()),
                safeTrim(req.getReceiverPhone()),
                safeTrim(req.getShippingAddress()),
                safeTrim(req.getNote()),
                req.getPaymentMethod() != null ? req.getPaymentMethod().name() : PaymentMethod.COD.name(),
                String.valueOf(Boolean.TRUE.equals(req.getConfirmPriceChange()))
        );
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(canonical.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    private String safeTrim(String s) {
        return s == null ? "" : s.trim();
    }
}
