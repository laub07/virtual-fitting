package com.example.virtual_fitting.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "product")
public class Product {

    @Id
    @Column(name = "product_id")
    private Long productId;

    @Column(name = "product_name")
    private String productName;

    private int price;

    @Column(name = "image_url")
    private String imageUrl;

    public Long getProductId() { return productId; }
    public String getProductName() { return productName; }
    public int getPrice() { return price; }
    public String getImageUrl() { return imageUrl; }
}