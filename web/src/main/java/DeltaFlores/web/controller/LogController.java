package DeltaFlores.web.controller;

import DeltaFlores.web.service.LogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class LogController {

    private final LogService logService;

    /**
     * Endpoint para obtener las últimas líneas del archivo de log de la aplicación.
     * El acceso está restringido a usuarios con roles ADMIN o SUPER_ADMIN.
     * @param lines El número de líneas a obtener. Por defecto, 500.
     * @return Una lista con las últimas líneas de log.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<String>> getLogs(
            @RequestParam(defaultValue = "500") int lines) {
        
        List<String> logs = logService.getLatestLogs(lines);
        return ResponseEntity.ok(logs);
    }
}
