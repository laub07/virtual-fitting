package com.example.virtual_fitting.dto.user;

public class LoginResponse {

    private Long id;
    private String username;
    private String name;
    private String role;
    private String message;

    public LoginResponse(Long id, String username, String name, String role, String message) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.role = role;
        this.message = message;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getName() {
        return name;
    }

    public String getRole() {
        return role;
    }

    public String getMessage() {
        return message;
    }
}