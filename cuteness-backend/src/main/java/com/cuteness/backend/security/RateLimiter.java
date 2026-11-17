package com.cuteness.backend.security;

import com.cuteness.backend.exception.TooManyRequestsException;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory sliding-window rate limiter.
 * Good enough for a single server instance; use Redis/Bucket4j if you run several instances.
 */
@Component
public class RateLimiter {

    private static final long MAX_WINDOW_MS = Duration.ofHours(1).toMillis();
    private static final int  CLEANUP_THRESHOLD = 20_000;

    private final ConcurrentHashMap<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    /** Returns true if the call is allowed (and records it), false if the limit is reached. */
    public boolean tryAcquire(String key, int maxHits, Duration window) {
        long now = System.currentTimeMillis();
        long cutoff = now - window.toMillis();

        if (hits.size() > CLEANUP_THRESHOLD) {
            cleanup(now);
        }

        Deque<Long> deque = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (deque) {
            while (!deque.isEmpty() && deque.peekFirst() < cutoff) {
                deque.pollFirst();
            }
            if (deque.size() >= maxHits) {
                return false;
            }
            deque.addLast(now);
            return true;
        }
    }

    /** Throws TooManyRequestsException (HTTP 429) when the limit is reached. */
    public void check(String key, int maxHits, Duration window) {
        if (!tryAcquire(key, maxHits, window)) {
            throw new TooManyRequestsException(
                    "Trop de tentatives. Veuillez réessayer plus tard.");
        }
    }

    private void cleanup(long now) {
        hits.entrySet().removeIf(e -> {
            Deque<Long> d = e.getValue();
            synchronized (d) {
                return d.isEmpty() || d.peekLast() < now - MAX_WINDOW_MS;
            }
        });
    }
}
