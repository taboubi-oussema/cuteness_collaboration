package com.cuteness.backend.controller;

import com.cuteness.backend.dto.ChatRequest;
import com.cuteness.backend.dto.ChatResponse;
import com.cuteness.backend.security.ClientIpResolver;
import com.cuteness.backend.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final ClientIpResolver clientIp;

    @PostMapping
    public ResponseEntity<?> chat(@Valid @RequestBody ChatRequest request, HttpServletRequest httpRequest) {
        String ip = clientIp.resolve(httpRequest);

        if (!chatService.checkAndRecord(ip)) {
            return ResponseEntity.status(429).body(
                    Map.of("error", "Limite de messages atteinte. Réessaie dans une heure.")
            );
        }

        String reply = chatService.chat(request.getMessage(), request.getContext());
        return ResponseEntity.ok(new ChatResponse(reply));
    }
}
