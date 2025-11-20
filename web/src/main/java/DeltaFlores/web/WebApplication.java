package DeltaFlores.web;

import DeltaFlores.web.entities.*;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.SalaRepository;
import DeltaFlores.web.repository.UserRepository;
import com.google.cloud.spring.autoconfigure.storage.GcpStorageAutoConfiguration;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.TimeZone;

@SpringBootApplication(exclude = {GcpStorageAutoConfiguration.class})
public class WebApplication {

    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(WebApplication.class, args);
    }

}
