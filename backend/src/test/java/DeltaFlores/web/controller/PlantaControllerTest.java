package DeltaFlores.web.controller;

import DeltaFlores.web.entities.AppRole;
import DeltaFlores.web.entities.Cepa;
import DeltaFlores.web.entities.NuevaEtapa;
import DeltaFlores.web.entities.Planta;
import DeltaFlores.web.entities.Sala;
import DeltaFlores.web.entities.TipoAmbiente;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.repository.CepaRepository;
import DeltaFlores.web.repository.PlantaRepository;
import DeltaFlores.web.repository.SalaRepository;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.security.CustomUserDetails;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * HTTP contract tests for {@code fecha_siembra} (SD-1, SD-4, SD-5, SD-6).
 * <p>
 * Requires a running PostgreSQL instance (see application.properties). The suite is
 * CI-gated and non-blocking: it is skipped/fails only when no database is available.
 * All tests are transactional and roll back after each test.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
class PlantaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SalaRepository salaRepository;

    @Autowired
    private CepaRepository cepaRepository;

    @Autowired
    private PlantaRepository plantaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private Sala testSala;
    private Cepa testCepa;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setUsername("planta_fecha_test_owner");
        testUser.setEmail("planta_fecha_test_owner@example.com");
        testUser.setPassword(passwordEncoder.encode("test1234"));
        testUser.setNombre("Fecha");
        testUser.setApellido("Test");
        testUser.setRol(AppRole.ROLE_GROWER);
        testUser.setFechaRegistro(LocalDate.now());
        testUser = userRepository.save(testUser);

        testSala = new Sala();
        testSala.setNombre("Fecha Test Sala");
        testSala.setUser(testUser);
        testSala.setTipoAmbiente(TipoAmbiente.INTERIOR);
        testSala = salaRepository.save(testSala);

        testCepa = new Cepa();
        testCepa.setGeneticaParental("Fecha Test Genetica");
        testCepa.setAbreviatura("FTS");
        testCepa.setUser(testUser);
        testCepa = cepaRepository.save(testCepa);

        userRepository.flush();
        salaRepository.flush();
        cepaRepository.flush();

        CustomUserDetails principal = new CustomUserDetails(
                testUser.getId(),
                testUser.getUsername(),
                testUser.getPassword(),
                testUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // =========================================================================
    // POST /api/plantas — creation
    // =========================================================================

    @Nested
    @DisplayName("POST /api/plantas")
    class CreatePlanta {

        @Test
        @DisplayName("should persist explicit fecha_siembra and expose it with snake_case key")
        void testCreateWithExplicitFechaSiembra() throws Exception {
            Map<String, Object> body = baseCreateBody("Planta Siembra Explicita");
            body.put("fecha_siembra", "2025-06-01");

            MvcResult result = mockMvc.perform(post("/api/plantas")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.fecha_siembra").value("2025-06-01"))
                    .andReturn();

            Long id = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

            mockMvc.perform(get("/api/plantas/{id}", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.fecha_siembra").value("2025-06-01"));
        }

        @Test
        @DisplayName("should default fecha_siembra to today when the field is omitted")
        void testCreateWithoutFechaSiembra() throws Exception {
            mockMvc.perform(post("/api/plantas")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(baseCreateBody("Planta Sin Siembra"))))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.fecha_siembra").value(LocalDate.now().toString()));
        }

        @Test
        @DisplayName("should default fecha_siembra to today when the field is null")
        void testCreateWithNullFechaSiembra() throws Exception {
            Map<String, Object> body = baseCreateBody("Planta Siembra Null");
            body.put("fecha_siembra", null);

            mockMvc.perform(post("/api/plantas")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.fecha_siembra").value(LocalDate.now().toString()));
        }

        @Test
        @DisplayName("should ignore legacy fechaCreacion and use the server date as fecha_siembra")
        void testLegacyFechaCreacionIsNotUsedAsFechaSiembra() throws Exception {
            Map<String, Object> body = baseCreateBody("Planta Cliente Legado");
            body.put("fechaCreacion", "2025-01-01");

            mockMvc.perform(post("/api/plantas")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.fecha_siembra").value(LocalDate.now().toString()));
        }

        @Test
        @DisplayName("should reject a future fecha_siembra with 400")
        void testFutureFechaSiembraReturns400() throws Exception {
            Map<String, Object> body = baseCreateBody("Planta Fecha Futura");
            body.put("fecha_siembra", LocalDate.now().plusDays(1).toString());

            mockMvc.perform(post("/api/plantas")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest());

            assertThat(plantaRepository.findByNombre("Planta Fecha Futura")).isEmpty();
        }

        @Test
        @DisplayName("should reject a non-ISO fecha_siembra format with 400")
        void testInvalidFechaSiembraFormatReturns400() throws Exception {
            Map<String, Object> body = baseCreateBody("Planta Fecha Formato");
            body.put("fecha_siembra", "10/01/2026");

            mockMvc.perform(post("/api/plantas")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should reject a fecha_siembra before 1900-01-01 with 400")
        void testTooOldFechaSiembraReturns400() throws Exception {
            Map<String, Object> body = baseCreateBody("Planta Fecha Antigua");
            body.put("fecha_siembra", "1800-01-01");

            mockMvc.perform(post("/api/plantas")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should accept a valid past fecha_siembra")
        void testValidPastFechaSiembraAccepted() throws Exception {
            Map<String, Object> body = baseCreateBody("Planta Fecha Pasada");
            body.put("fecha_siembra", "2025-06-01");

            mockMvc.perform(post("/api/plantas")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.fecha_siembra").value("2025-06-01"));
        }
    }

    // =========================================================================
    // PUT /api/plantas/{id} — partial update
    // =========================================================================

    @Nested
    @DisplayName("PUT /api/plantas/{id}")
    class UpdatePlanta {

        @Test
        @DisplayName("should update fecha_siembra and keep fechaCreacion untouched")
        void testUpdateChangesFechaSiembraAndKeepsFechaCreacion() throws Exception {
            Planta planta = savePlanta(LocalDate.of(2025, 12, 1));
            LocalDate fechaCreacionOriginal = planta.getFechaCreacion();

            Map<String, Object> body = baseUpdateBody("Planta Editada");
            body.put("fecha_siembra", "2025-11-15");

            mockMvc.perform(put("/api/plantas/{id}", planta.getId())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.fecha_siembra").value("2025-11-15"))
                    .andExpect(jsonPath("$.fechaCreacion").value(fechaCreacionOriginal.toString()));
        }

        @Test
        @DisplayName("should preserve fecha_siembra when the field is omitted")
        void testUpdateWithoutFechaSiembraPreservesValue() throws Exception {
            Planta planta = savePlanta(LocalDate.of(2025, 12, 1));

            mockMvc.perform(put("/api/plantas/{id}", planta.getId())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(baseUpdateBody("Planta Sin Cambio"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.fecha_siembra").value("2025-12-01"));
        }

        @Test
        @DisplayName("should preserve fecha_siembra when the field is null")
        void testUpdateWithNullFechaSiembraPreservesValue() throws Exception {
            Planta planta = savePlanta(LocalDate.of(2025, 12, 1));

            Map<String, Object> body = baseUpdateBody("Planta Null Update");
            body.put("fecha_siembra", null);

            mockMvc.perform(put("/api/plantas/{id}", planta.getId())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.fecha_siembra").value("2025-12-01"));
        }
    }

    private Map<String, Object> baseCreateBody(String nombre) {
        Map<String, Object> body = new HashMap<>();
        body.put("nombre", nombre);
        body.put("etapa", NuevaEtapa.VEGETACION.name());
        body.put("salaId", testSala.getId());
        body.put("cepaId", testCepa.getId());
        body.put("produccion", 0);
        body.put("isPublic", false);
        return body;
    }

    private Map<String, Object> baseUpdateBody(String nombre) {
        return baseCreateBody(nombre);
    }

    private Planta savePlanta(LocalDate fechaSiembra) {
        Planta planta = new Planta();
        planta.setNombre("Planta Update " + fechaSiembra);
        planta.setUser(testUser);
        planta.setCepa(testCepa);
        planta.setSala(testSala);
        planta.setEtapa(NuevaEtapa.VEGETACION);
        planta.setProduccion(0);
        planta.setFechaSiembra(fechaSiembra);
        return plantaRepository.saveAndFlush(planta);
    }
}
