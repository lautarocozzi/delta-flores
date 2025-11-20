package DeltaFlores.web.service;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

@Service
@Profile("minio")
public class MinioFileStorageService implements FileStorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket.name}")
    private String bucketName;

    @Value("${minio.endpoint}")
    private String endpoint;

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

            // Construct the URL. Assuming the endpoint is the public URL.
            // This might need adjustment if a different public URL is used.
            return endpoint + "/" + bucketName + "/" + objectName;

        } catch (Exception e) {
            throw new RuntimeException("Error uploading file to MinIO: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String fileUrl) {
        try {
            String objectName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
            minioClient.removeObject(
                    io.minio.RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            // Log the error but don't re-throw to avoid breaking a larger transaction
            // if, for example, the file was already deleted manually.
            System.err.println("Error deleting file from MinIO: " + e.getMessage());
        }
    }
}