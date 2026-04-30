package com.example.virtual_fitting.service;

import com.example.virtual_fitting.domain.CartItem;
import com.example.virtual_fitting.dto.cart.CartRequestDto;
import com.example.virtual_fitting.dto.cart.CartResponseDto;
import com.example.virtual_fitting.repository.CartRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;

    public CartServiceImpl(CartRepository cartRepository) {
        this.cartRepository = cartRepository;
    }

    @Override
    public List<CartResponseDto> getCartList(Long userId) {
        return cartRepository.findByUserId(userId)
                .stream()
                .map(cart -> new CartResponseDto(
                        cart.getCartId(),
                        cart.getUserId(),
                        cart.getProductId(),
                        cart.getSizeId(),
                        cart.getQuantity()
                ))
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

        return new CartResponseDto(
                savedCart.getCartId(),
                savedCart.getUserId(),
                savedCart.getProductId(),
                savedCart.getSizeId(),
                savedCart.getQuantity()
        );
    }

    @Override
    public void deleteCart(Long cartId) {
        cartRepository.deleteById(cartId);
    }
}