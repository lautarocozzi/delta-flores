package DeltaFlores.web.repository;

import DeltaFlores.web.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String email);
    Optional<User> findById(Long id);

    List<User> findAll();

    User save(User user);
    void deleteById(Long id);
    Optional<User> findByEmailAndPassword(String email, String password);

    List<User> findByNombre(String nombre);

    Optional<UserDetails> findByEmail(String email);
}
