
package com.example.virtual_fitting.dto;

public class WishlistResponseDto {

    private Long productId;
    private String productName;
    private String imageUrl;

    public WishlistResponseDto(
            Long productId,
            String productName,
            String imageUrl) {
        this.productId = productId;
        this.productName = productName;
        this.imageUrl = imageUrl;
    }

    public Long getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getImage() {
        return imageUrl;
    }
}
