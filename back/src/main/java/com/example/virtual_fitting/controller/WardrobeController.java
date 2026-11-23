package com.example.virtual_fitting.controller;

import com.example.virtual_fitting.domain.Wardrobe;
import com.example.virtual_fitting.repository.WardrobeRepository;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/wardrobe")
@CrossOrigin(origins = "http://localhost:3000")
public class WardrobeController {
    private final WardrobeRepository wardrobeRepository;

    public WardrobeController(WardrobeRepository wardrobeRepository) {
        this.wardrobeRepository = wardrobeRepository;
    }

    @GetMapping
    public List<Wardrobe> getWardrobe() {
        return wardrobeRepository.findAll();
    }
}
