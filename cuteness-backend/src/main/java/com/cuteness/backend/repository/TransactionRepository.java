package com.cuteness.backend.repository;

import com.cuteness.backend.entity.Transaction;
import com.cuteness.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Integer> {
    List<Transaction> findByUser(User user);
}
