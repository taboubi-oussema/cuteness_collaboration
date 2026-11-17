package com.cuteness.backend.repository;

import com.cuteness.backend.entity.OtpToken;
import com.cuteness.backend.enums.OtpContext;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findByEmailAndContext(String email, OtpContext context);
    void deleteByEmailAndContext(String email, OtpContext context);
}
