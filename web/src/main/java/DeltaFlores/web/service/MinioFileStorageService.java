package DeltaFlores.web.service;

import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.http.Method;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@Profile("minio")
@Log4j2
public class MinioFileStorageService implements FileStorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket.name}")
    private String bucketName;

    @Autowired
    public MinioFileStorageService(MinioClient minioClient) {
        this.minioClient = minioClient;
    }

    @Override
    public String uploadFile(MultipartFile file) {
        try {
            InputStream inputStream = file.getInputStream();
            String objectName = UUID.randomUUID().toString().replace("-", "") + "-" + file.getOriginalFilename();

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            return objectName;

        } catch (Exception e) {
            throw new RuntimeException("Error uploading file to MinIO: " + e.getMessage(), e);
        }
    }

    public String getPresignedUrl(String objectName) {
        if (!StringUtils.hasText(objectName)) {
            log.warn("⚠️ Se intentó generar una URL prefirmada para un objectName vacío o nulo.");
            return null;
        }
        try {
            String url = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectName)
                            .expiry(2, TimeUnit.HOURS)
                            .build());
            log.info("✅ URL prefirmada generada para {}: {}", objectName, url);
            return url;
        } catch (Exception e) {
            log.error("❌ Error al generar la URL prefirmada para {}: {}", objectName, e.getMessage());
            return null; // Or return a default/error URL
        }
    }

    @Override
    public void deleteFile(String objectName) {
        try {
            minioClient.removeObject(
                    io.minio.RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            // Log the error but don't re-throw to avoid breaking a larger transaction
            log.error("❌ Error al eliminar el archivo de MinIO: {}", e.getMessage());
        }
    }
}