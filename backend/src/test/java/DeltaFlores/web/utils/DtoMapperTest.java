package DeltaFlores.web.utils;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link DtoMapper} utility methods.
 * <p>
 * Focuses on the ubicacion auto-generation logic used by PlantaService
 * when creating or updating plant grid locations.
 */
class DtoMapperTest {

    // =========================================================================
    // generarUbicacion tests
    // =========================================================================

    @Nested
    @DisplayName("generarUbicacion()")
    class GenerarUbicacionTests {

        @Test
        @DisplayName("should generate full ubicacion with zona nombre, col, fila (1-based)")
        void testFullUbicacion() {
            String result = DtoMapper.generarUbicacion("A", 2, 3);
            assertEquals("A-F4-C3", result);
        }

        @Test
        @DisplayName("should generate ubicacion with zero coordinates (1-based → F1-C1)")
        void testZeroCoordinates() {
            String result = DtoMapper.generarUbicacion("Main", 0, 0);
            assertEquals("Main-F1-C1", result);
        }

        @Test
        @DisplayName("should replace spaces in zona nombre with hyphens")
        void testZonaNombreWithSpaces() {
            String result = DtoMapper.generarUbicacion("Zona A", 1, 2);
            assertEquals("Zona-A-F3-C2", result);
        }

        @Test
        @DisplayName("should handle zona nombre with multiple consecutive spaces")
        void testZonaNombreMultipleSpaces() {
            String result = DtoMapper.generarUbicacion("Zona   Centro", 4, 5);
            assertEquals("Zona-Centro-F6-C5", result);
        }

        @Test
        @DisplayName("should return null when zonaNombre is null")
        void testNullZonaNombre() {
            String result = DtoMapper.generarUbicacion(null, 2, 3);
            assertNull(result);
        }

        @Test
        @DisplayName("should handle large coordinate values (1-based)")
        void testLargeCoordinates() {
            String result = DtoMapper.generarUbicacion("BigZone", 99, 99);
            assertEquals("BigZone-F100-C100", result);
        }

        @Test
        @DisplayName("should use ? placeholder when columna or fila is null")
        void testNullCoordinates() {
            String result = DtoMapper.generarUbicacion("B", null, null);
            assertEquals("B-F?-C?", result);
        }

        @Test
        @DisplayName("should use ? placeholder when only fila is null")
        void testNullFilaOnly() {
            String result = DtoMapper.generarUbicacion("A", 3, null);
            assertEquals("A-F?-C4", result);
        }

        @Test
        @DisplayName("should use ? placeholder when only columna is null")
        void testNullColumnaOnly() {
            String result = DtoMapper.generarUbicacion("A", null, 3);
            assertEquals("A-F4-C?", result);
        }
    }
}