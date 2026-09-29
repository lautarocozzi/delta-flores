package DeltaFlores.web.repository;

import DeltaFlores.web.entities.AppRole;
import DeltaFlores.web.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameAndPassword(String username, String password);

    List<User> findByNombreContainingIgnoreCase(String nombre);

    List<User> findByRol(AppRole rol);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

}
