package DeltaFlores.web.service;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

/**
 * Implementación de FileStorageService para Google Cloud Storage.
 * Esta clase se activará solo cuando el perfil de Spring 'gcs' esté activo.
 */
@Service
@Profile("gcs")
@RequiredArgsConstructor
public class GcsFileStorageService implements FileStorageService {

    private final Storage storage;

    @Value("${gcs.bucket.name}")
    private String bucketName;

    @Override
    public String uploadFile(MultipartFile file) {
        try {
            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;

            BlobId blobId = BlobId.of(bucketName, uniqueFileName);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                    .setContentType(file.getContentType())
                    .build();

            storage.create(blobInfo, file.getBytes());

            // Devuelve la URL pública del archivo
            return String.format("https://storage.googleapis.com/%s/%s", bucketName, uniqueFileName);

        } catch (IOException e) {
            throw new RuntimeException("Error uploading file to GCS", e);
        }
    }
}
