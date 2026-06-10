package com.example.virtual_fitting.service;

import com.example.virtual_fitting.domain.Wishlist;
import com.example.virtual_fitting.dto.WishlistDTO;

import java.util.List;

public interface WishlistService {

    void addWishlist(WishlistDTO dto);

    void removeWishlist(Long userId, Long productId);

    List<Wishlist> getWishlist(Long userId);
}