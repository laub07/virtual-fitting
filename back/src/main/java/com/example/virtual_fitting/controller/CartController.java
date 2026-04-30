package com.example.virtual_fitting.controller;

import com.example.virtual_fitting.dto.cart.CartRequestDto;
import com.example.virtual_fitting.dto.cart.CartResponseDto;
import com.example.virtual_fitting.service.CartService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "http://localhost:3000")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/{userId}")
    public List<CartResponseDto> getCartList(@PathVariable Long userId) {
        return cartService.getCartList(userId);
    }

    @PostMapping
    public CartResponseDto addCart(@RequestBody CartRequestDto requestDto) {
        return cartService.addCart(requestDto);
    }

    @DeleteMapping("/{cartId}")
    public void deleteCart(@PathVariable Long cartId) {
        cartService.deleteCart(cartId);
    }
}