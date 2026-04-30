package com.example.virtual_fitting.dto.cart;

public class CartRequestDto {

    private Long userId;
    private Long productId;
    private Long sizeId;
    private int quantity;

    public Long getUserId() {
        return userId;
    }

    public Long getProductId() {
        return productId;
    }

    public Long getSizeId() {
        return sizeId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public void setSizeId(Long sizeId) {
        this.sizeId = sizeId;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}