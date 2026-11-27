package com.foodhub.order.dto;

import com.foodhub.order.entity.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateOrderRequest {

    @NotBlank(message = "Tên người nhận không được để trống")
    @Size(min = 2, max = 100, message = "Tên người nhận phải từ 2 đến 100 ký tự")
    private String receiverName;

    @NotBlank(message = "Số điện thoại người nhận không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{8,10}$", message = "Số điện thoại người nhận không đúng định dạng Việt Nam")
    private String receiverPhone;

    @NotBlank(message = "Địa chỉ giao hàng không được để trống")
    @Size(min = 5, max = 300, message = "Địa chỉ giao hàng phải từ 5 đến 300 ký tự")
    private String shippingAddress;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String note;

    private PaymentMethod paymentMethod = PaymentMethod.COD;

    // Khách hàng gửi true nếu đã xem và đồng ý với giá mới sau khi có thông báo đổi giá
    private Boolean confirmPriceChange = false;

    public String getReceiverName() {
        return receiverName;
    }

    public void setReceiverName(String receiverName) {
        this.receiverName = receiverName;
    }

    public String getReceiverPhone() {
        return receiverPhone;
    }

    public void setReceiverPhone(String receiverPhone) {
        this.receiverPhone = receiverPhone;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public Boolean getConfirmPriceChange() {
        return confirmPriceChange;
    }

    public void setConfirmPriceChange(Boolean confirmPriceChange) {
        this.confirmPriceChange = confirmPriceChange;
    }
}
