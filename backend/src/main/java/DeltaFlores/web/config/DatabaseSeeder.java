package DeltaFlores.web.config;

import DeltaFlores.web.entities.*;
import DeltaFlores.web.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Log4j2
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            log.info("📢 Base de datos ya poblada. Saltando Seeder.");
            return;
        }

        log.info("🌱 Iniciando Poblado de Base de Datos...");

        // 1. Usuarios
        List<User> users = new ArrayList<>();
        users.add(createUser("admin@floresdelta.com", "Admin", "Master", AppRole.ROLE_ADMIN));
        users.add(createUser("grower1@floresdelta.com", "Juan", "Cultivo", AppRole.ROLE_GROWER));
        users.add(createUser("grower2@floresdelta.com", "Maria", "Green", AppRole.ROLE_GROWER));
        users.add(createUser("grower3@floresdelta.com", "Pedro", "Roots", AppRole.ROLE_GROWER));
        users.add(createUser("test@floresdelta.com", "Test", "User", AppRole.ROLE_GROWER));

        userRepository.saveAll(users);

        log.info("✅ Carga de datos completada: {} usuarios creados.", users.size());
    }

    private User createUser(String email, String nombre, String apellido, AppRole role) {
        User u = new User();
        u.setUsername(email);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode("123456"));
        u.setNombre(nombre);
        u.setApellido(apellido);
        u.setRol(role);
        return u;
    }
}
