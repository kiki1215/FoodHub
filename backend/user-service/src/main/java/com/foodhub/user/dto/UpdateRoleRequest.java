package com.foodhub.user.dto;

import com.foodhub.user.entity.Role;
import jakarta.validation.constraints.NotNull;

public class UpdateRoleRequest {

    @NotNull(message = "Vai trò không được để trống (CUSTOMER hoặc ADMIN)")
    private Role role;

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
