package com.example.virtual_fitting.domain;


import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "wardrobe")
public class Wardrobe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "clothing_id")
    private Long clothingId;

    @Column(name = "clothing_name", nullable = false)
    private String clothingName;

    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "color")
    private String color;

    @Column(name = "image_path", nullable = false)
    private String imagePath;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Long getClothingId() {
        return clothingId;
    }

    public String getClothingName() {
        return clothingName;
    }

    public String getCategory() {
        return category;
    }

    public String getColor() {
        return color;
    }

    public String getImagePath() {
        return imagePath;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
