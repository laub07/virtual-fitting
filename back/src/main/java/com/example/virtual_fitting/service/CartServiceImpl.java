package com.example.virtual_fitting.service;

import com.example.virtual_fitting.domain.CartItem;
import com.example.virtual_fitting.domain.Product;
import com.example.virtual_fitting.dto.cart.CartRequestDto;
import com.example.virtual_fitting.dto.cart.CartResponseDto;
import com.example.virtual_fitting.repository.CartRepository;
import com.example.virtual_fitting.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;

    public CartServiceImpl(CartRepository cartRepository, ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
    }

    @Override
    public List<CartResponseDto> getCartList(Long userId) {
        return cartRepository.findByUserId(userId)
                .stream()
                .map(cart -> {
                    Product product = productRepository.findById(cart.getProductId())
                            .orElse(null);

                    return new CartResponseDto(
                            cart.getCartId(),
                            cart.getUserId(),
                            cart.getProductId(),
                            cart.getSizeId(),
                            cart.getQuantity(),
                            product != null ? product.getProductName() : "상품 정보 없음",
                            product != null ? product.getPrice() : 0,
                            product != null ? product.getImageUrl() : ""
                    );
                })
                .collect(Collectors.toList());
    }

    @Override
    public CartResponseDto addCart(CartRequestDto requestDto) {
        CartItem cart = new CartItem();

        cart.setUserId(requestDto.getUserId());
        cart.setProductId(requestDto.getProductId());
        cart.setSizeId(requestDto.getSizeId());
        cart.setQuantity(requestDto.getQuantity());

        CartItem savedCart = cartRepository.save(cart);

        Product product = productRepository.findById(savedCart.getProductId())
                .orElse(null);

        return new CartResponseDto(
                savedCart.getCartId(),
                savedCart.getUserId(),
                savedCart.getProductId(),
                savedCart.getSizeId(),
                savedCart.getQuantity(),
                product != null ? product.getProductName() : "상품 정보 없음",
                product != null ? product.getPrice() : 0,
                product != null ? product.getImageUrl() : ""
        );
    }

    @Override
    public void deleteCart(Long cartId) {
        cartRepository.deleteById(cartId);
    }
}