package com.example.virtual_fitting.service;

import com.example.virtual_fitting.domain.Wishlist;
import com.example.virtual_fitting.dto.WishlistDTO;
import com.example.virtual_fitting.repository.WishlistRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;

    public WishlistServiceImpl(WishlistRepository wishlistRepository) {
        this.wishlistRepository = wishlistRepository;
    }

    @Override
    @Transactional
    public void addWishlist(WishlistDTO dto) {

        if (wishlistRepository
                .findByUserIdAndProductId(dto.getUserId(), dto.getProductId())
                .isPresent()) {
            return;
        }

        Wishlist wishlist = new Wishlist(
                dto.getUserId(),
                dto.getProductId()
        );

        wishlistRepository.save(wishlist);
    }

    @Override
    @Transactional
    public void removeWishlist(Long userId, Long productId) {
        wishlistRepository.findByUserIdAndProductId(userId, productId)
                .ifPresent(wishlistRepository::delete);
    }

    @Override
    @Transactional
    public List<Wishlist> getWishlist(Long userId) {
        return wishlistRepository.findByUserId(userId);
    }
}