package DeltaFlores.web.service;

import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Collections;
import java.util.List;

@Service
@Log4j2
public class LogService {

    private final File logFile = new File("logs/app.log");

    /**
     * Obtiene las últimas N líneas del archivo de log principal.
     * @param numberOfLines El número de líneas a obtener desde el final del archivo.
     * @return Una lista de strings, donde cada string es una línea del log.
     */
    public List<String> getLatestLogs(int numberOfLines) {
        if (!logFile.exists()) {
            log.warn("El archivo de log 'logs/app.log' no existe todavía.");
            return Collections.singletonList("El archivo de log no se ha generado todavía. Realice algunas acciones para que se cree.");
        }

        try {
            List<String> allLines = Files.readAllLines(logFile.toPath());
            int totalLines = allLines.size();
            int fromIndex = Math.max(0, totalLines - numberOfLines);
            return allLines.subList(fromIndex, totalLines);
        } catch (IOException e) {
            log.error("Error al leer el archivo de log 'logs/app.log'", e);
            return Collections.singletonList("Error al leer el archivo de log: " + e.getMessage());
        }
    }
}
