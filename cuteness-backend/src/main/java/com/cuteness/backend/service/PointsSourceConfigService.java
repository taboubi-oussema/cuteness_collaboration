package com.cuteness.backend.service;

import com.cuteness.backend.entity.PointsSourceConfig;
import com.cuteness.backend.repository.PointsSourceConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PointsSourceConfigService {

    private final PointsSourceConfigRepository pointsSourceConfigRepository;

    public List<Map<String, Object>> getAll() {
        return pointsSourceConfigRepository.findAll()
                .stream().map(this::toMap).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> update(Long id, Map<String, Object> body) {
        PointsSourceConfig cfg = pointsSourceConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PointsSourceConfig introuvable"));

        if (body.containsKey("pointsParAction"))
            cfg.setPointsParAction(toInt(body.get("pointsParAction")));
        if (body.containsKey("description"))
            cfg.setDescription((String) body.get("description"));
        if (body.containsKey("actif"))
            cfg.setActif(Boolean.TRUE.equals(body.get("actif")));

        return toMap(pointsSourceConfigRepository.save(cfg));
    }

    private Map<String, Object> toMap(PointsSourceConfig cfg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",             cfg.getId());
        m.put("sourceType",     cfg.getSourceType());
        m.put("pointsParAction", cfg.getPointsParAction());
        m.put("description",    cfg.getDescription());
        m.put("actif",          cfg.isActif());
        return m;
    }

    private int toInt(Object val) {
        if (val instanceof Number n) return n.intValue();
        if (val instanceof String s) return Integer.parseInt(s);
        return 0;
    }
}
