package com.foodhub.menu.dto;

public class ImageUploadResponse {

    private String fileName;
    private String imageUrl;
    private String contentType;
    private long size;

    public ImageUploadResponse() {
    }

    public ImageUploadResponse(String fileName, String imageUrl, String contentType, long size) {
        this.fileName = fileName;
        this.imageUrl = imageUrl;
        this.contentType = contentType;
        this.size = size;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }
}
