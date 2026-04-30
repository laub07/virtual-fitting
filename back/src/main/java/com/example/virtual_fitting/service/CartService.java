package com.example.virtual_fitting.service;

import com.example.virtual_fitting.dto.cart.CartRequestDto;
import com.example.virtual_fitting.dto.cart.CartResponseDto;

import java.util.List;

public interface CartService {

    List<CartResponseDto> getCartList(Long userId);

    CartResponseDto addCart(CartRequestDto requestDto);

    void deleteCart(Long cartId);
}