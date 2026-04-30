package com.example.virtual_fitting.dto.cart;

public class CartResponseDto {

    private Long cartId;
    private Long userId;
    private Long productId;
    private Long sizeId;
    private int quantity;

    public CartResponseDto(Long cartId, Long userId, Long productId, Long sizeId, int quantity) {
        this.cartId = cartId;
        this.userId = userId;
        this.productId = productId;
        this.sizeId = sizeId;
        this.quantity = quantity;
    }

    public Long getCartId() {
        return cartId;
    }

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
}