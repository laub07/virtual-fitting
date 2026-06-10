package com.example.virtual_fitting.controller;

import com.example.virtual_fitting.domain.Wishlist;
import com.example.virtual_fitting.dto.WishlistDTO;
import com.example.virtual_fitting.service.WishlistService;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "http://localhost:3000")
public class WishlistController {

    private final WishlistService wishlistService;


    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }


    @PostMapping
    public void addWishlist(@RequestBody WishlistDTO dto) {
        wishlistService.addWishlist(dto);
    }


    @DeleteMapping
    public void removeWishlist(
            @RequestParam Long userId,
            @RequestParam Long productId) {

        wishlistService.removeWishlist(userId, productId);
    }

    // 찜 목록 조회
    @GetMapping("/{userId}")
    public List<Wishlist> getWishlist(@PathVariable Long userId) {
        return wishlistService.getWishlist(userId);
    }
}