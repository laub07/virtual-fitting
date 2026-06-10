package com.example.virtual_fitting.dto.cart;

public class CartResponseDto {

    private Long cartId;
    private Long userId;
    private Long productId;
    private Long sizeId;
    private int quantity;

    private String productName;
    private int price;
    private String imageUrl;

    public CartResponseDto(Long cartId, Long userId, Long productId, Long sizeId,
                           int quantity, String productName, int price, String imageUrl) {
        this.cartId = cartId;
        this.userId = userId;
        this.productId = productId;
        this.sizeId = sizeId;
        this.quantity = quantity;
        this.productName = productName;
        this.price = price;
        this.imageUrl = imageUrl;
    }

    public Long getCartId() { return cartId; }
    public Long getUserId() { return userId; }
    public Long getProductId() { return productId; }
    public Long getSizeId() { return sizeId; }
    public int getQuantity() { return quantity; }
    public String getProductName() { return productName; }
    public int getPrice() { return price; }
    public String getImageUrl() { return imageUrl; }
}