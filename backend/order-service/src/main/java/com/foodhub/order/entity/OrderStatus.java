package com.foodhub.order.entity;

import java.util.EnumSet;
import java.util.Set;

public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PREPARING,
    SHIPPING,
    COMPLETED,
    CANCELLED;

    public static final Set<OrderStatus> UNFINISHED_STATUSES =
            EnumSet.of(PENDING, CONFIRMED, PREPARING, SHIPPING);

    public boolean canTransitionTo(OrderStatus next) {
        if (next == null || this == next) {
            return false;
        }
        return switch (this) {
            case PENDING -> next == CONFIRMED || next == CANCELLED;
            case CONFIRMED -> next == PREPARING || next == CANCELLED;
            case PREPARING -> next == SHIPPING || next == CANCELLED;
            case SHIPPING -> next == COMPLETED;
            case COMPLETED, CANCELLED -> false;
        };
    }
}
