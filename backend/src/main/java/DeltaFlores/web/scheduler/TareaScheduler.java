package DeltaFlores.web.scheduler;

import DeltaFlores.web.service.TareaProgramadaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Log4j2
public class TareaScheduler {

    private final TareaProgramadaService tareaService;

    @Scheduled(fixedRate = 60000) // every minute
    public void processDueTasks() {
        try {
            tareaService.processDueTasks();
        } catch (Exception e) {
            log.error("Error en TareaScheduler: {}", e.getMessage(), e);
        }
    }
}
