package com.cuteness.backend.service;

import com.cuteness.backend.entity.PageContent;
import com.cuteness.backend.repository.PageContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PageContentService {

    private final PageContentRepository repo;

    /** Retourne toutes les entrées de contenu */
    public List<PageContent> getAll() {
        return repo.findAll();
    }

    /** Retourne toutes les entrées pour une section donnée */
    public List<PageContent> getBySection(String section) {
        return repo.findAllBySection(section);
    }

    /**
     * Upsert: update if (section, cle) exists, else create.
     * Accepts a list of partial objects [{section, cle, valeur, type}]
     */
    public List<PageContent> saveAll(List<Map<String, String>> entries) {
        for (Map<String, String> e : entries) {
            String section = e.get("section");
            String cle     = e.get("cle");
            String valeur  = e.get("valeur");
            String type    = e.getOrDefault("type", "text");

            PageContent pc = repo.findBySectionAndCle(section, cle)
                    .orElseGet(() -> PageContent.builder()
                            .section(section)
                            .cle(cle)
                            .type(type)
                            .build());
            pc.setValeur(valeur);
            pc.setType(type);
            repo.save(pc);
        }
        return repo.findAll();
    }
}
