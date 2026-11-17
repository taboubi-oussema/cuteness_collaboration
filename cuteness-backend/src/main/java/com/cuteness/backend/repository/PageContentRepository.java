package com.cuteness.backend.repository;

import com.cuteness.backend.entity.PageContent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PageContentRepository extends JpaRepository<PageContent, Integer> {
    List<PageContent> findAllBySection(String section);
    Optional<PageContent> findBySectionAndCle(String section, String cle);
}
