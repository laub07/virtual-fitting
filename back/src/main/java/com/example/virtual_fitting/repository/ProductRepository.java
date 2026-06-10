package com.example.virtual_fitting.repository;

import com.example.virtual_fitting.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
}