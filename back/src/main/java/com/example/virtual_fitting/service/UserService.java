package com.example.virtual_fitting.service;

import com.example.virtual_fitting.dto.user.LoginResponse;
import com.example.virtual_fitting.dto.user.UserLoginRequest;
import com.example.virtual_fitting.dto.user.UserResponse;
import com.example.virtual_fitting.dto.user.UserSignupRequest;

import java.util.List;

public interface UserService {
    void signup(UserSignupRequest request);
    LoginResponse login(UserLoginRequest request);
    List<UserResponse> getAllUsers();
    void deleteUser(Long id);
}