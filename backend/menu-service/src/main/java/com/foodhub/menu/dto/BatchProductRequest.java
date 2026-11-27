package com.foodhub.menu.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class BatchProductRequest {

    @NotEmpty(message = "Danh sách ID món ăn không được để trống")
    private List<Long> ids;

    public List<Long> getIds() {
        return ids;
    }

    public void setIds(List<Long> ids) {
        this.ids = ids;
    }
}
