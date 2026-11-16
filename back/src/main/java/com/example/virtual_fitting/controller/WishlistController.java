package com.example.virtual_fitting.controller;

import com.example.virtual_fitting.domain.Wishlist;
import com.example.virtual_fitting.domain.Product;
import com.example.virtual_fitting.dto.WishlistDTO;
import com.example.virtual_fitting.dto.WishlistResponseDto;
import com.example.virtual_fitting.repository.ProductRepository;
import com.example.virtual_fitting.service.WishlistService;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "http://localhost:3000")
public class WishlistController {

    private final WishlistService wishlistService;
    private final ProductRepository productRepository;

    public WishlistController(
            WishlistService wishlistService,
            ProductRepository productRepository) {

        this.wishlistService = wishlistService;
        this.productRepository = productRepository;
    }

    // 찜 추가
    @PostMapping
    public void addWishlist(@RequestBody WishlistDTO dto) {
        wishlistService.addWishlist(dto);
    }

    // 찜 삭제
    @DeleteMapping
    public void removeWishlist(
            @RequestParam Long userId,
            @RequestParam Long productId) {

        wishlistService.removeWishlist(userId, productId);
    }

    // 찜 목록 조회 (상품 정보 포함)
    @GetMapping("/{userId}")
    public List<WishlistResponseDto> getWishlist(
            @PathVariable Long userId) {

        List<Wishlist> wishlist =
                wishlistService.getWishlist(userId);

        return wishlist.stream()
                .map(item -> {
                    Product product = productRepository
                            .findById(item.getProductId())
                            .orElse(null);

                    if (product == null) {
                        return null;
                    }

                    return new WishlistResponseDto(
                            product.getProductId(),
                            product.getProductName(),
                            product.getImageUrl()
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }
}
