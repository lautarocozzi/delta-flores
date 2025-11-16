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

    @Bean
    public CommandLineRunner commandLineRunner(
            UserRepository userRepository,
            SalaRepository salaRepository,
            PlantaRepository plantaRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            // Create admin user if it doesn't exist
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin"));
                admin.setRole(AppRole.ROLE_ADMIN);
                userRepository.save(admin);
            }

            // Create a sala if none exists
            if (salaRepository.count() == 0) {
                Sala sala = new Sala();
                sala.setNombre("Sala de Vegetación");
                salaRepository.save(sala);

                // Create a planta if none exists
                if (plantaRepository.count() == 0) {
                    Planta planta = new Planta();
                    planta.setGenetica("Critical");
                    planta.setEtapa(NuevaEtapa.VEGETACION);
                    planta.setSala(sala);
                    plantaRepository.save(planta);
                }
            }
        };
    }
}
