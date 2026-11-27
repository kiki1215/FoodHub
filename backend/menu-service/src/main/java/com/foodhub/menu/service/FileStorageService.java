package com.foodhub.menu.service;

import com.foodhub.menu.dto.ImageUploadResponse;
import com.foodhub.menu.exception.AppException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Map<String, String> ALLOWED_CONTENT_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/jpg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif"
    );

    @Value("${app.upload.dir:/app/uploads/menu}")
    private String uploadDir;

    @Value("${app.upload.max-size-bytes:5242880}")
    private long maxSizeBytes;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        try {
            this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(this.rootLocation);
        } catch (IOException ex) {
            throw new IllegalStateException("Không thể khởi tạo thư mục lưu trữ ảnh món ăn", ex);
        }
    }

    public ImageUploadResponse storeImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Vui lòng chọn tệp hình ảnh để tải lên");
        }

        if (file.getSize() > maxSizeBytes) {
            throw new AppException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 5MB)");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.containsKey(contentType.toLowerCase())) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP hoặc GIF");
        }

        String extension = ALLOWED_CONTENT_TYPES.get(contentType.toLowerCase());
        String storedFileName = UUID.randomUUID() + extension;
        Path targetPath = rootLocation.resolve(storedFileName).normalize();

        if (!targetPath.startsWith(rootLocation)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Tên tệp hình ảnh không hợp lệ");
        }

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể lưu tệp hình ảnh, vui lòng thử lại");
        }

        String publicUrl = "/api/products/images/" + storedFileName;
        return new ImageUploadResponse(storedFileName, publicUrl, contentType, file.getSize());
    }

    public Resource loadImageAsResource(String fileName) {
        if (fileName == null || fileName.isBlank() || fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Tên tệp hình ảnh không hợp lệ");
        }

        try {
            Path filePath = rootLocation.resolve(fileName).normalize();
            if (!filePath.startsWith(rootLocation) || !Files.exists(filePath)) {
                throw new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy hình ảnh yêu cầu");
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new AppException(HttpStatus.NOT_FOUND, "Không thể đọc tệp hình ảnh");
            }
            return resource;
        } catch (MalformedURLException ex) {
            throw new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy hình ảnh yêu cầu");
        }
    }

    public String detectContentType(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif")) return "image/gif";
        return "image/jpeg";
    }
}
