package DeltaFlores.web;

import com.google.cloud.spring.autoconfigure.storage.GcpStorageAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication(exclude = {GcpStorageAutoConfiguration.class})
@EnableScheduling
public class WebApplication {

    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(WebApplication.class, args);
    }

}
