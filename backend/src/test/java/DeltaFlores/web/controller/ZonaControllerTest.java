package DeltaFlores.web.controller;

import DeltaFlores.web.dto.PlantaDto;
import DeltaFlores.web.dto.SalaDto;
import DeltaFlores.web.dto.ZonaDto;
import DeltaFlores.web.entities.*;
import DeltaFlores.web.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Zona CRUD and related plant-zona interactions.
 * <p>
 * Requires a running PostgreSQL instance (see application.properties).
 * All tests are transactional and roll back after each test.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
class ZonaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SalaRepository salaRepository;

    @Autowired
    private ZonaRepository zonaRepository;

    @Autowired
    private PlantaRepository plantaRepository;

    @Autowired
    private CepaRepository cepaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Shared test data
    private User testUser;
    private User adminUser;
    private Sala testSala;
    private Cepa testCepa;
    private Planta testPlanta;
    private Zona testZona;

    @BeforeEach
    void setUp() {
        // Create admin user (used by @WithMockUser for admin operations)
        if (!userRepository.findByUsername("zona_test_admin").isPresent()) {
            adminUser = new User();
            adminUser.setUsername("zona_test_admin");
            adminUser.setPassword(passwordEncoder.encode("test1234"));
            adminUser.setNombre("Admin");
            adminUser.setApellido("Test");
            adminUser.setRol(AppRole.ROLE_SUPER_ADMIN);
            adminUser.setFechaRegistro(LocalDate.now());
            adminUser = userRepository.save(adminUser);
        } else {
            adminUser = userRepository.findByUsername("zona_test_admin").get();
        }

        // Create grower user
        if (!userRepository.findByUsername("zona_test_grower").isPresent()) {
            testUser = new User();
            testUser.setUsername("zona_test_grower");
            testUser.setPassword(passwordEncoder.encode("test1234"));
            testUser.setNombre("Grower");
            testUser.setApellido("Test");
            testUser.setRol(AppRole.ROLE_GROWER);
            testUser.setFechaRegistro(LocalDate.now());
            testUser = userRepository.save(testUser);
        } else {
            testUser = userRepository.findByUsername("zona_test_grower").get();
        }

        // Create a sala
        if (testSala == null || !salaRepository.findById(testSala.getId()).isPresent()) {
            testSala = new Sala();
            testSala.setNombre("Test Sala Zonas");
            testSala.setUser(adminUser);
            testSala.setTipoAmbiente(TipoAmbiente.INTERIOR);
            testSala = salaRepository.save(testSala);
        }

        // Create a cepa
        if (testCepa == null || !cepaRepository.findById(testCepa.getId()).isPresent()) {
            testCepa = new Cepa();
            testCepa.setGeneticaParental("Test Genetica");
            testCepa.setAbreviatura("TST");
            testCepa.setUser(adminUser);
            testCepa = cepaRepository.save(testCepa);
        }

        // Create a zona
        if (testZona == null || !zonaRepository.findById(testZona.getId()).isPresent()
                || !testZona.getSala().getId().equals(testSala.getId())) {
            testZona = new Zona();
            testZona.setNombre("Zona A");
            testZona.setSala(testSala);
            testZona.setPosicionX(0);
            testZona.setPosicionY(0);
            testZona.setColumnas(4);
            testZona.setFilas(4);
            testZona = zonaRepository.save(testZona);
        }

        // Create a planta assigned to the zona
        if (testPlanta == null || !plantaRepository.findById(testPlanta.getId()).isPresent()) {
            testPlanta = new Planta();
            testPlanta.setNombre("Test Planta Zona");
            testPlanta.setUser(adminUser);
            testPlanta.setCepa(testCepa);
            testPlanta.setSala(testSala);
            testPlanta.setEtapa(NuevaEtapa.VEGETACION);
            testPlanta.setZona(testZona);
            testPlanta.setColumnaEnZona(1);
            testPlanta.setFilaEnZona(2);
            testPlanta.setUbicacion("Zona-A-F3-C2");
            testPlanta = plantaRepository.save(testPlanta);
        }

        // Flush to ensure all entities are persisted before test methods
        userRepository.flush();
        salaRepository.flush();
        zonaRepository.flush();
        plantaRepository.flush();
    }

    // =========================================================================
    // Zona CRUD Tests
    // =========================================================================

    @Nested
    @DisplayName("GET /api/zonas/sala/{salaId}")
    class GetZonasBySala {

        @Test
        @WithMockUser(roles = "GROWER")
        @DisplayName("should return zones for a given sala")
        void testGetZonasBySala() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/zonas/sala/{salaId}", testSala.getId()))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andReturn();

            String json = result.getResponse().getContentAsString();
            List<ZonaDto> zonas = objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, ZonaDto.class));

            assertThat(zonas).isNotEmpty();
            assertThat(zonas).anyMatch(z -> z.getNombre().equals("Zona A"));
        }

        @Test
        @WithMockUser(roles = "GROWER")
        @DisplayName("should return empty list when sala has no zones")
        void testGetZonasBySalaEmpty() throws Exception {
            // Create a sala with no zones
            Sala emptySala = new Sala();
            emptySala.setNombre("Empty Sala");
            emptySala.setUser(adminUser);
            emptySala.setTipoAmbiente(TipoAmbiente.INTERIOR);
            emptySala = salaRepository.save(emptySala);

            mockMvc.perform(get("/api/zonas/sala/{salaId}", emptySala.getId()))
                    .andExpect(status().isOk())
                    .andExpect(content().json("[]"));
        }
    }

    @Nested
    @DisplayName("POST /api/zonas")
    class CreateZona {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("should create a new zona and return it")
        void testCreateZona() throws Exception {
            ZonaDto newZona = new ZonaDto();
            newZona.setSalaId(testSala.getId());
            newZona.setNombre("Zona B");
            newZona.setPosicionX(1);
            newZona.setPosicionY(0);
            newZona.setColumnas(3);
            newZona.setFilas(3);

            String json = objectMapper.writeValueAsString(newZona);

            MvcResult result = mockMvc.perform(post("/api/zonas")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.nombre").value("Zona B"))
                    .andExpect(jsonPath("$.salaId").value(testSala.getId()))
                    .andExpect(jsonPath("$.columnas").value(3))
                    .andExpect(jsonPath("$.filas").value(3))
                    .andReturn();

            ZonaDto created = objectMapper.readValue(
                    result.getResponse().getContentAsString(), ZonaDto.class);
            assertThat(created.getId()).isNotNull();
        }

        @Test
        @WithMockUser(roles = "GROWER")
        @DisplayName("should reject create with 403 for non-admin role")
        void testCreateZonaForbiddenForGrower() throws Exception {
            ZonaDto newZona = new ZonaDto();
            newZona.setSalaId(testSala.getId());
            newZona.setNombre("Zona C");

            mockMvc.perform(post("/api/zonas")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(newZona)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PUT /api/zonas/{id}")
    class UpdateZona {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("should update an existing zona")
        void testUpdateZona() throws Exception {
            ZonaDto update = new ZonaDto();
            update.setNombre("Zona A Updated");
            update.setPosicionX(2);
            update.setPosicionY(1);
            update.setColumnas(5);
            update.setFilas(5);

            mockMvc.perform(put("/api/zonas/{id}", testZona.getId())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(update)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.nombre").value("Zona A Updated"))
                    .andExpect(jsonPath("$.columnas").value(5))
                    .andExpect(jsonPath("$.filas").value(5));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("should return 404 when updating non-existent zona")
        void testUpdateZonaNotFound() throws Exception {
            ZonaDto update = new ZonaDto();
            update.setNombre("Ghost");

            mockMvc.perform(put("/api/zonas/{id}", 99999L)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(update)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/zonas/{id}")
    class DeleteZona {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("should delete zona and nullify planta references")
        void testDeleteZonaNullifiesPlantReferences() throws Exception {
            // Verify planta initially references the zona
            assertThat(testPlanta.getZona()).isNotNull();
            assertThat(testPlanta.getZona().getId()).isEqualTo(testZona.getId());

            mockMvc.perform(delete("/api/zonas/{id}", testZona.getId()))
                    .andExpect(status().isNoContent());

            // Verify planta's zona reference is nullified
            Planta updatedPlanta = plantaRepository.findById(testPlanta.getId()).orElseThrow();
            assertThat(updatedPlanta.getZona()).isNull();
            assertThat(updatedPlanta.getColumnaEnZona()).isNull();
            assertThat(updatedPlanta.getFilaEnZona()).isNull();
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("should return 404 when deleting non-existent zona")
        void testDeleteZonaNotFound() throws Exception {
            mockMvc.perform(delete("/api/zonas/{id}", 99999L))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/zonas/{zonaId}/plantas")
    class GetPlantasByZona {

        @Test
        @WithMockUser(roles = "GROWER")
        @DisplayName("should return plantas assigned to the zona")
        void testGetPlantasByZona() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/zonas/{zonaId}/plantas", testZona.getId()))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andReturn();

            String json = result.getResponse().getContentAsString();
            List<PlantaDto> plantas = objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, PlantaDto.class));

            assertThat(plantas).isNotEmpty();
            assertThat(plantas).anyMatch(p -> p.getNombre().equals("Test Planta Zona"));
        }

        @Test
        @WithMockUser(roles = "GROWER")
        @DisplayName("should include ubicacion and cepa info in response")
        void testPlantasIncludeUbicacionAndCepa() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/zonas/{zonaId}/plantas", testZona.getId()))
                    .andExpect(status().isOk())
                    .andReturn();

            String json = result.getResponse().getContentAsString();
            List<PlantaDto> plantas = objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, PlantaDto.class));

            assertThat(plantas).isNotEmpty();
            PlantaDto planta = plantas.stream()
                    .filter(p -> p.getNombre().equals("Test Planta Zona"))
                    .findFirst().orElseThrow();

            assertThat(planta.getUbicacion()).isEqualTo("Zona-A-F3-C2");
            assertThat(planta.getZonaId()).isEqualTo(testZona.getId());
            assertThat(planta.getZonaNombre()).isEqualTo("Zona A");
            assertThat(planta.getCepaId()).isEqualTo(testCepa.getId());
            assertThat(planta.getSalaId()).isEqualTo(testSala.getId());
        }

        @Test
        @WithMockUser(roles = "GROWER")
        @DisplayName("should return 404 when zona does not exist")
        void testGetPlantasByZonaNotFound() throws Exception {
            mockMvc.perform(get("/api/zonas/{zonaId}/plantas", 99999L))
                    .andExpect(status().isNotFound());
        }
    }
}
