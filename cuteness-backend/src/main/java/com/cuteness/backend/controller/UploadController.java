package com.cuteness.backend.controller;

import com.cuteness.backend.security.SafeFileStorage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private static final Path UPLOAD_DIR = Paths.get("uploads");

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPERVISEUR')")
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        // Images only: jpg, jpeg, png, webp, avif, gif (extension + file signature are checked)
        String filename = SafeFileStorage.store(file, UPLOAD_DIR, SafeFileStorage.IMAGE_EXTENSIONS);
        return ResponseEntity.ok(Map.of("url", "/uploads/" + filename));
    }
}
