package com.cuteness.backend.security;

import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Stores uploaded files safely: extension allow-list, file-signature check
 * (the declared Content-Type is client-controlled, so it is not trusted),
 * and random server-generated file names.
 */
public final class SafeFileStorage {

    public static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "avif", "gif");
    public static final Set<String> IMAGE_AND_PDF_EXTENSIONS =
            Set.of("jpg", "jpeg", "png", "webp", "avif", "gif", "pdf");

    private SafeFileStorage() {}

    /** Validates and saves the file in {@code dir}; returns the generated file name. */
    public static String store(MultipartFile file, Path dir, Set<String> allowedExtensions) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Fichier vide.");
        }

        String original = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        String ext = StringUtils.getFilenameExtension(original);
        ext = ext == null ? "" : ext.toLowerCase(Locale.ROOT);

        if (!allowedExtensions.contains(ext)) {
            throw new IllegalArgumentException("Type de fichier non autorisé. Formats acceptés : "
                    + String.join(", ", allowedExtensions));
        }

        byte[] header;
        try (InputStream in = file.getInputStream()) {
            header = in.readNBytes(16);
        }
        if (!matchesSignature(ext, header)) {
            throw new IllegalArgumentException("Le contenu du fichier ne correspond pas à son extension.");
        }

        Files.createDirectories(dir);
        String filename = UUID.randomUUID() + "." + ext;
        Path target = dir.resolve(filename).normalize();
        if (!target.startsWith(dir.normalize())) {
            throw new IllegalArgumentException("Nom de fichier invalide.");
        }
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }
        return filename;
    }

    private static boolean matchesSignature(String ext, byte[] h) {
        switch (ext) {
            case "png":
                return startsWith(h, 0x89, 0x50, 0x4E, 0x47);
            case "jpg":
            case "jpeg":
                return startsWith(h, 0xFF, 0xD8, 0xFF);
            case "gif":
                return startsWith(h, 'G', 'I', 'F', '8');
            case "pdf":
                return startsWith(h, '%', 'P', 'D', 'F');
            case "webp":
                return h.length >= 12
                        && startsWith(h, 'R', 'I', 'F', 'F')
                        && new String(h, 8, 4, StandardCharsets.US_ASCII).equals("WEBP");
            case "avif":
                if (h.length < 12) return false;
                String brand = new String(h, 4, 8, StandardCharsets.US_ASCII);
                return brand.startsWith("ftyp") && (brand.endsWith("avif") || brand.endsWith("avis")
                        || brand.endsWith("mif1") || brand.endsWith("miaf"));
            default:
                return false;
        }
    }

    private static boolean startsWith(byte[] h, int... sig) {
        if (h.length < sig.length) return false;
        for (int i = 0; i < sig.length; i++) {
            if ((h[i] & 0xFF) != sig[i]) return false;
        }
        return true;
    }
}
