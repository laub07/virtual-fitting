package com.example.virtual_fitting.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "cart")
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cart_id")
    private Long cartId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "size_id")
    private Long sizeId;

    private int quantity;

    public CartItem() {
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

    public void setCartId(Long cartId) {
        this.cartId = cartId;
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