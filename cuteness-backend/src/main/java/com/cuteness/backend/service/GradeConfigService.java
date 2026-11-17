package com.cuteness.backend.service;

import com.cuteness.backend.entity.GradeConfig;
import com.cuteness.backend.enums.RewardType;
import com.cuteness.backend.repository.GradeConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GradeConfigService {

    private final GradeConfigRepository gradeConfigRepository;

    public List<Map<String, Object>> getAll() {
        return gradeConfigRepository.findAllByOrderByPointsMinAsc()
                .stream().map(this::toMap).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> update(Long id, Map<String, Object> body) {
        GradeConfig cfg = gradeConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("GradeConfig introuvable"));

        if (body.containsKey("pointsMin"))
            cfg.setPointsMin(toInt(body.get("pointsMin")));
        if (body.containsKey("rewardType") && body.get("rewardType") != null)
            cfg.setRewardType(RewardType.valueOf((String) body.get("rewardType")));
        if (body.containsKey("rewardValeur"))
            cfg.setRewardValeur(toDouble(body.get("rewardValeur")));
        if (body.containsKey("rewardDureeJours"))
            cfg.setRewardDureeJours(toInt(body.get("rewardDureeJours")));
        if (body.containsKey("rewardDescription"))
            cfg.setRewardDescription((String) body.get("rewardDescription"));

        return toMap(gradeConfigRepository.save(cfg));
    }

    private Map<String, Object> toMap(GradeConfig cfg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",                cfg.getId());
        m.put("grade",             cfg.getGrade());
        m.put("pointsMin",         cfg.getPointsMin());
        m.put("rewardType",        cfg.getRewardType());
        m.put("rewardValeur",      cfg.getRewardValeur());
        m.put("rewardDureeJours",  cfg.getRewardDureeJours());
        m.put("rewardDescription", cfg.getRewardDescription());
        return m;
    }

    private int toInt(Object val) {
        if (val instanceof Number n) return n.intValue();
        if (val instanceof String s) return Integer.parseInt(s);
        return 0;
    }

    private double toDouble(Object val) {
        if (val instanceof Number n) return n.doubleValue();
        if (val instanceof String s) return Double.parseDouble(s);
        return 0.0;
    }
}
