package DeltaFlores.web.service;

import DeltaFlores.web.dto.CreateUserDto;
import DeltaFlores.web.dto.UserDto;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Log4j2
@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    private final EmailTemplateService emailTemplateService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        return new org.springframework.security.core.userdetails.User(user.getUsername(), user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name())));
    }

    @Transactional
    public UserDto createUser(CreateUserDto createUserDto) {
        User user = DtoMapper.createUserDtoToUser(createUserDto, passwordEncoder);
        User savedUser = userRepository.save(user);
        return DtoMapper.userToUserDto(savedUser);
    }
}
