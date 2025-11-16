package DeltaFlores.web.service.email;


import lombok.extern.log4j.Log4j2;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;

@Service
@EnableAsync
@Log4j2
public class EmailTemplateService {
    private final JavaMailSender;
}
