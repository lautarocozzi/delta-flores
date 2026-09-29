package DeltaFlores.web;

import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;

@Configuration
public class JacksonConfiguration {
    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jackson2ObjectMapperBuilderCustomizer(){
        return builder -> {
            // Standard ISO date formatter
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

            // DateTime formatter that accepts both "yyyy-MM-dd'T'HH:mm" and "yyyy-MM-dd'T'HH:mm:ss"
            DateTimeFormatter dateTimeFormatter = new DateTimeFormatterBuilder()
                    .appendPattern("yyyy-MM-dd'T'HH:mm")
                    .optionalStart()
                    .appendPattern(":ss")
                    .optionalEnd()
                    .toFormatter();

            // Deserializers
            builder.deserializerByType(LocalDate.class, new LocalDateDeserializer(dateFormatter));
            builder.deserializerByType(LocalDateTime.class, new LocalDateTimeDeserializer(dateTimeFormatter));

            // Serializers — always emit with seconds for consistency
            builder.serializerByType(LocalDate.class, new LocalDateSerializer(dateFormatter));
            builder.serializerByType(LocalDateTime.class, new LocalDateTimeSerializer(
                    DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
        };
    }
}
