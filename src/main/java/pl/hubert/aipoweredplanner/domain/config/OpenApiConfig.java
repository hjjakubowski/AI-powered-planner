package pl.hubert.aipoweredplanner.domain.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI aiPoweredPlannerOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("AI Powered Planner API")
                        .version("1.0.0")
                        .description("REST API for projects, tasks, account management and AI plan suggestions."));
    }
}
