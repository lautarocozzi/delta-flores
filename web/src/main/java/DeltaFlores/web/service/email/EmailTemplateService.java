package DeltaFlores.web.service.email;


import lombok.extern.log4j.Log4j2;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;

// @Service // Comentado temporalmente para evitar la necesidad de configurar un servidor de correo
@EnableAsync
@Log4j2
public class EmailTemplateService {
    private final JavaMailSender javaMailSender;

    public EmailTemplateService(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

}
