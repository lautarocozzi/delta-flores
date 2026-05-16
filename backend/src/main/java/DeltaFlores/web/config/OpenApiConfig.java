package DeltaFlores.web.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(title = "FloresDelta API", version = "v1"), security = @SecurityRequirement(name = "jwt"))
@SecurityScheme(
    name = "jwt", // The name of the cookie
    type = SecuritySchemeType.APIKEY,
    in = SecuritySchemeIn.COOKIE
)
public class OpenApiConfig {



}
