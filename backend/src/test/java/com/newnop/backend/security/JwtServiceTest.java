package com.newnop.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey",
                "dGVzdC1zZWNyZXQtZm9yLWp3dC1zaWduaW5nLWluLWF1dG9tYXRlZC10ZXN0cw==");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 3600000L);

        userDetails = User.builder()
                .username("user@example.com")
                .password("irrelevant")
                .roles("USER")
                .build();
    }

    @Test
    void generateToken_thenExtractUsername_returnsOriginalSubject() {
        String token = jwtService.generateToken(userDetails);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo("user@example.com");
    }

    @Test
    void isTokenValid_forMatchingUserAndUnexpiredToken_returnsTrue() {
        String token = jwtService.generateToken(userDetails);

        assertThat(jwtService.isTokenValid(token, userDetails)).isTrue();
    }

    @Test
    void isTokenValid_forDifferentUser_returnsFalse() {
        String token = jwtService.generateToken(userDetails);
        UserDetails otherUser = User.builder()
                .username("other@example.com")
                .password("irrelevant")
                .roles("USER")
                .build();

        assertThat(jwtService.isTokenValid(token, otherUser)).isFalse();
    }

    @Test
    void isTokenValid_forExpiredToken_throws() {
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", -1000L);
        String expiredToken = jwtService.generateToken(userDetails);

        org.junit.jupiter.api.Assertions.assertThrows(
                io.jsonwebtoken.ExpiredJwtException.class,
                () -> jwtService.isTokenValid(expiredToken, userDetails));
    }
}
