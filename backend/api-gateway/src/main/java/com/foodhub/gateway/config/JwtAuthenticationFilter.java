package com.foodhub.gateway.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodhub.gateway.dto.ApiResponse;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Set;

@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_USER_ROLE = "X-User-Role";

    private static final Set<String> VALID_ROLES = Set.of("CUSTOMER", "ADMIN");
    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/api/auth/register",
            "/api/auth/login"
    );

    private final ObjectMapper objectMapper;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    private SecretKey signingKey;

    public JwtAuthenticationFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        if (jwtSecret == null || jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET phải được cấu hình và có độ dài tối thiểu 32 ký tự (256-bit).");
        }
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest originalRequest = exchange.getRequest();

        // Cho phép CORS preflight request đi qua
        if (originalRequest.getMethod() == HttpMethod.OPTIONS) {
            return chain.filter(exchange);
        }

        // BƯỚC 1: Luôn xóa X-User-Id và X-User-Role do Client tự gửi lên (chống giả mạo)
        ServerHttpRequest sanitizedRequest = originalRequest.mutate()
                .headers(headers -> {
                    headers.remove(HEADER_USER_ID);
                    headers.remove(HEADER_USER_ROLE);
                })
                .build();

        String path = sanitizedRequest.getURI().getPath();
        HttpMethod method = sanitizedRequest.getMethod();

        // Chặn tuyệt đối truy cập các endpoint nội bộ qua API Gateway
        if (path.startsWith("/internal/")) {
            return writeJsonError(exchange, HttpStatus.FORBIDDEN,
                    "Không được phép truy cập trực tiếp API nội bộ");
        }

        // Các API công khai (đăng ký, đăng nhập, xem/tìm kiếm danh mục & món ăn) được phép đi qua sau khi xóa header giả mạo
        if (isPublicEndpoint(method, path)) {
            return chain.filter(exchange.mutate().request(sanitizedRequest).build());
        }

        // BƯỚC 2: Xác thực JWT Token từ Authorization Header
        String authHeader = sanitizedRequest.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return writeJsonError(exchange, HttpStatus.UNAUTHORIZED,
                    "Vui lòng đăng nhập để truy cập tài nguyên này");
        }

        String token = authHeader.substring(7).trim();
        if (token.isEmpty()) {
            return writeJsonError(exchange, HttpStatus.UNAUTHORIZED,
                    "Token xác thực không hợp lệ");
        }

        Claims claims;
        try {
            claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException ex) {
            return writeJsonError(exchange, HttpStatus.UNAUTHORIZED,
                    "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        } catch (JwtException | IllegalArgumentException ex) {
            return writeJsonError(exchange, HttpStatus.UNAUTHORIZED,
                    "Token xác thực không hợp lệ");
        }

        String userId = claims.getSubject();
        String role = claims.get("role", String.class);

        if (userId == null || userId.isBlank() || role == null || !VALID_ROLES.contains(role)) {
            return writeJsonError(exchange, HttpStatus.UNAUTHORIZED,
                    "Thông tin xác thực trong token không hợp lệ");
        }

        // Kiểm tra quyền quản trị đối với các API /api/admin/**
        if (path.startsWith("/api/admin/") && !"ADMIN".equals(role)) {
            return writeJsonError(exchange, HttpStatus.FORBIDDEN,
                    "Bạn không có quyền truy cập chức năng quản trị");
        }

        // BƯỚC 3 & 4: Thiết lập lại X-User-Id và X-User-Role tin cậy rồi chuyển tiếp xuống service con
        ServerHttpRequest authenticatedRequest = sanitizedRequest.mutate()
                .header(HEADER_USER_ID, userId)
                .header(HEADER_USER_ROLE, role)
                .build();

        return chain.filter(exchange.mutate().request(authenticatedRequest).build());
    }

    private boolean isPublicEndpoint(HttpMethod method, String path) {
        if (PUBLIC_PATHS.contains(path)) {
            return true;
        }
        if (method == HttpMethod.GET) {
            return path.equals("/api/categories")
                    || path.startsWith("/api/categories/")
                    || path.equals("/api/products")
                    || path.startsWith("/api/products/");
        }
        return false;
    }

    private Mono<Void> writeJsonError(ServerWebExchange exchange, HttpStatus status, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        byte[] body;
        try {
            body = objectMapper.writeValueAsBytes(ApiResponse.error(message));
        } catch (JsonProcessingException e) {
            body = ("{\"success\":false,\"message\":\"" + message + "\",\"data\":null}")
                    .getBytes(StandardCharsets.UTF_8);
        }

        DataBuffer buffer = response.bufferFactory().wrap(body);
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return -10;
    }
}
