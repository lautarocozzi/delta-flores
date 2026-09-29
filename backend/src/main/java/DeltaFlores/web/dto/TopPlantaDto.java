package DeltaFlores.web.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class TopPlantaDto implements Serializable {
    private Long plantaId;
    private String plantaNombre;
    private String plantaImagenUrl;
    private String cepaNombre;
    private int favoriteCount;
    private Long userId;
    private String userUsername;
}
