package com.newnop.backend.service;

import com.newnop.backend.dtos.request.LoginRequest;
import com.newnop.backend.dtos.request.RegisterRequest;
import com.newnop.backend.dtos.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}