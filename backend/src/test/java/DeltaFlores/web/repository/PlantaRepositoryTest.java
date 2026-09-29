package DeltaFlores.web.repository;

import DeltaFlores.web.entities.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository-level tests for Planta queries.
 * <p>
 * Verifies that after the EAGER→LAZY migration, queries with {@code @EntityGraph}
 * correctly fetch related entities (cepa, sala, zona) and prevent
 * LazyInitializationException.
 * <p>
 * Requires a running PostgreSQL instance.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
@Rollback
class PlantaRepositoryTest {

    @Autowired
    private PlantaRepository plantaRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SalaRepository salaRepository;

    @Autowired
    private ZonaRepository zonaRepository;

    @Autowired
    private CepaRepository cepaRepository;

    private User testUser;
    private Sala testSala;
    private Cepa testCepa;
    private Zona testZona;

    @BeforeEach
    void setUp() {
        PasswordEncoder encoder = new BCryptPasswordEncoder();

        testUser = new User();
        testUser.setUsername("planta_repo_test");
        testUser.setPassword(encoder.encode("test"));
        testUser.setNombre("Repo");
        testUser.setApellido("Test");
        testUser.setRol(AppRole.ROLE_GROWER);
        testUser.setFechaRegistro(LocalDate.now());
        testUser = userRepository.save(testUser);

        testSala = new Sala();
        testSala.setNombre("Repo Test Sala");
        testSala.setUser(testUser);
        testSala.setTipoAmbiente(TipoAmbiente.INTERIOR);
        testSala = salaRepository.save(testSala);

        testCepa = new Cepa();
        testCepa.setGeneticaParental("Repo Genetica");
        testCepa.setAbreviatura("RPO");
        testCepa.setUser(testUser);
        testCepa = cepaRepository.save(testCepa);

        testZona = new Zona();
        testZona.setNombre("Repo Zona");
        testZona.setSala(testSala);
        testZona.setPosicionX(0);
        testZona.setPosicionY(0);
        testZona.setColumnas(3);
        testZona.setFilas(3);
        testZona = zonaRepository.save(testZona);

        // Create a few plantas with full relationships
        for (int i = 1; i <= 3; i++) {
            Planta planta = new Planta();
            planta.setNombre("Repo Planta " + i);
            planta.setUser(testUser);
            planta.setCepa(testCepa);
            planta.setSala(testSala);
            planta.setEtapa(NuevaEtapa.VEGETACION);
            planta.setZona(testZona);
            planta.setColumnaEnZona(i);
            planta.setFilaEnZona(i);
            planta.setUbicacion("RPO_ZRepo_Zona_C" + i + "_F" + i);
            plantaRepository.save(planta);
        }

        plantaRepository.flush();
    }

    @Test
    @DisplayName("findByUserId should eagerly fetch cepa, sala, zona without LazyInitializationException")
    void testFindByUserIdEagerLoadsAssociations() {
        List<Planta> plantas = plantaRepository.findByUserId(testUser.getId());

        assertThat(plantas).hasSize(3);
        // Accessing lazy associations inside the transaction should work
        // because @EntityGraph eagerly fetches them
        for (Planta planta : plantas) {
            assertThat(planta.getCepa()).isNotNull();
            assertThat(planta.getCepa().getAbreviatura()).isEqualTo("RPO");
            assertThat(planta.getSala()).isNotNull();
            assertThat(planta.getSala().getNombre()).isEqualTo("Repo Test Sala");
            assertThat(planta.getZona()).isNotNull();
            assertThat(planta.getZona().getNombre()).isEqualTo("Repo Zona");
        }
    }

    @Test
    @DisplayName("findAll should eagerly fetch cepa, sala, zona without LazyInitializationException")
    void testFindAllEagerLoadsAssociations() {
        List<Planta> plantas = plantaRepository.findAll();

        assertThat(plantas).isNotEmpty();
        // Verify ASSOCIATIONS ARE FETCHED — no LazyInitializationException
        for (Planta planta : plantas) {
            // These should all be loaded thanks to @EntityGraph on findAll()
            assertThat(planta.getCepa()).isNotNull();
            assertThat(planta.getSala()).isNotNull();
        }
    }

    @Test
    @DisplayName("findByIdWithEvents should eagerly fetch cepa, sala, zona and events")
    void testFindByIdWithEventsEagerLoadsAssociations() {
        List<Planta> plantas = plantaRepository.findByUserId(testUser.getId());
        assertThat(plantas).isNotEmpty();

        Long plantaId = plantas.get(0).getId();
        Planta planta = plantaRepository.findByIdWithEvents(plantaId).orElseThrow();

        // Verify eager fetches work (no LazyInitializationException)
        assertThat(planta.getCepa()).isNotNull();
        assertThat(planta.getSala()).isNotNull();
        assertThat(planta.getZona()).isNotNull();
        assertThat(planta.getEvents()).isNotNull();
    }

    @Test
    @DisplayName("findBySalaId should eagerly fetch cepa, sala, zona")
    void testFindBySalaIdEagerLoadsAssociations() {
        List<Planta> plantas = plantaRepository.findBySalaId(testSala.getId());

        assertThat(plantas).isNotEmpty();
        for (Planta planta : plantas) {
            assertThat(planta.getCepa()).isNotNull();
            assertThat(planta.getSala()).isNotNull();
            assertThat(planta.getZona()).isNotNull();
        }
    }

    @Test
    @DisplayName("findById should eagerly fetch cepa, sala, zona")
    void testFindByIdEagerLoadsAssociations() {
        List<Planta> plantas = plantaRepository.findByUserId(testUser.getId());
        assertThat(plantas).isNotEmpty();

        Long plantaId = plantas.get(0).getId();
        Planta planta = plantaRepository.findById(plantaId).orElseThrow();

        // Verify @EntityGraph on findById fetches associations
        assertThat(planta.getCepa()).isNotNull();
        assertThat(planta.getCepa().getAbreviatura()).isEqualTo("RPO");
        assertThat(planta.getSala()).isNotNull();
        assertThat(planta.getSala().getNombre()).isEqualTo("Repo Test Sala");
        assertThat(planta.getZona()).isNotNull();
        assertThat(planta.getZona().getNombre()).isEqualTo("Repo Zona");
    }

    @Test
    @DisplayName("findByNombre should eagerly fetch cepa, sala, zona")
    void testFindByNombreEagerLoadsAssociations() {
        List<Planta> plantas = plantaRepository.findByNombre("Repo Planta 1");

        assertThat(plantas).isNotEmpty();
        for (Planta planta : plantas) {
            assertThat(planta.getCepa()).isNotNull();
            assertThat(planta.getSala()).isNotNull();
            assertThat(planta.getZona()).isNotNull();
        }
    }
}
