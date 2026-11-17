package com.cuteness.backend.repository;

import com.cuteness.backend.entity.Notification;
import com.cuteness.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByDestinataireOrderByDateCreationDesc(User user);
    long countByDestinataireAndLuFalse(User user);

    @Modifying
    @Query("UPDATE Notification n SET n.lu = true WHERE n.destinataire = :user")
    void markAllAsRead(User user);
}
