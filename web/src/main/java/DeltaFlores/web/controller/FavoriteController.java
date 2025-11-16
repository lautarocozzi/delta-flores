package DeltaFlores.web.controller;

import DeltaFlores.web.service.FavoriteService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/favoritos")
public class FavoriteController {
    private final FavoriteService favoriteService;

}
