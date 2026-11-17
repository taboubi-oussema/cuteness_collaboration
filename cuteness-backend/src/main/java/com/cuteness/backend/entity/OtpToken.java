package com.cuteness.backend.entity;

import com.cuteness.backend.enums.OtpContext;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "otp_token")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String otp;

    @Column(nullable = false)
    private String email;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OtpContext context;

    public OtpToken(String otp, String email, OtpContext context) {
        this.otp = otp;
        this.email = email;
        this.expiryDate = LocalDateTime.now().plusMinutes(10);
        this.context = context;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiryDate);
    }
}
