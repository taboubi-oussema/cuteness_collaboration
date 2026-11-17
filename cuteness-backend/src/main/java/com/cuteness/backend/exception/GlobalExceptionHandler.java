package com.cuteness.backend.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(com.cuteness.backend.exception.AccountInactiveException.class)
    public ResponseEntity<Map<String, String>> handleAccountInactive(
            com.cuteness.backend.exception.AccountInactiveException ex) {
        String msg = ex.getMessage() != null ? ex.getMessage() : "Compte inactif";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", msg, "message", msg));
    }

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<Map<String, String>> handleTooManyRequests(TooManyRequestsException ex) {
        String msg = ex.getMessage() != null ? ex.getMessage() : "Trop de requêtes. Veuillez réessayer plus tard.";
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("error", msg, "message", msg));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Accès refusé", "message", "Accès refusé"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = error instanceof FieldError ? ((FieldError) error).getField() : error.getObjectName();
            String errorMessage = error.getDefaultMessage() != null ? error.getDefaultMessage() : "Valeur invalide";
            errors.put(fieldName, errorMessage);
        });
        Map<String, Object> resp = new HashMap<>();
        resp.put("error", "Validation failed");
        resp.put("message", "Données fournies invalides");
        resp.put("details", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(resp);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        String msg = ex.getMessage() != null ? ex.getMessage() : "Paramètre invalide";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", msg, "message", msg));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        log.error("Runtime exception: {} - {}", ex.getClass().getSimpleName(), ex.getMessage(), ex);
        String msg = ex.getMessage() != null ? ex.getMessage() : "Une erreur est survenue";
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", msg, "message", msg));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception ex) {
        log.error("Unhandled exception: {} - {}", ex.getClass().getSimpleName(), ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "error", "Internal server error",
                        "message", "Une erreur interne est survenue. Veuillez réessayer plus tard."));
    }
}
