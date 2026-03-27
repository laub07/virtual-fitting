package com.example.virtual_fitting.service;

import com.example.virtual_fitting.domain.User;
import com.example.virtual_fitting.dto.user.LoginResponse;
import com.example.virtual_fitting.dto.user.UserLoginRequest;
import com.example.virtual_fitting.dto.user.UserResponse;
import com.example.virtual_fitting.dto.user.UserSignupRequest;
import com.example.virtual_fitting.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void signup(UserSignupRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        User user = new User(
                request.getUsername(),
                request.getPassword(),
                request.getName(),
                request.getBirth(),
                request.getPhone(),
                request.getRole() == null || request.getRole().isBlank() ? "USER" : request.getRole()
        );

        userRepository.save(user);
    }

    @Override
    public LoginResponse login(UserLoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("아이디가 존재하지 않습니다."));

        if (!user.getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        return new LoginResponse(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getRole(),
                "로그인 성공"
        );
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getName(),
                        user.getBirth(),
                        user.getPhone(),
                        user.getRole(),
                        user.getCreatedAt()
                ))
                .toList();
    }

    @Override
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}