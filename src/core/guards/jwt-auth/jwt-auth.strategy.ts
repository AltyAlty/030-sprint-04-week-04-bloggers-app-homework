import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../../../modules/user/application/auth/auth.service';
import { AuthConfig } from '../../../modules/user/config/auth.config';
import { UserDocumentType } from '../../../modules/user/domain/users/document-types/user.document-type';
import { DomainException, DomainExceptionCode } from '../../exceptions/domain/domain.exception';
import { AccessTokenPayloadDTO } from './dto/access-token-payload.dto';
import { UserJwtAuthContextDTO } from './dto/user-jwt-auth-context.dto';

/*Стратегия для авторизации по JWT, используя библиотеку Passport.js.*/
@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy, 'jwt') {
  public constructor(
    public readonly authConfig: AuthConfig,
    private readonly authService: AuthService
  ) {
    /*Настраиваем как библиотеке Passport.js работать с JWT.*/
    super({
      /*Указываем искать токен в заголовке "Authorization" в формате "Bearer token".*/
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      /*Указываем не игнорировать проверку срока годности токена.*/
      ignoreExpiration: false,
      /*Указываем секрет.*/
      secretOrKey: authConfig.AT_SECRET,
    });
  }

  /*Реализовываем метод "validate()", требуемый библиотекой Passport.js. Этот метод в данном случае принимает
  декодированный payload из JWT.*/
  public async validate(payload: AccessTokenPayloadDTO): Promise<UserJwtAuthContextDTO> {
    /*Просим сервис "AuthService" валидировать payload из JWT.*/
    const user: UserDocumentType | null = await this.authService.validateJwtPayload(payload);

    /*Если payload из JWT не был валидирован, то выбрасываем исключение "DomainException" с информацией об этом.*/
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.InvalidAccessJwtPayload,
        message: 'Invalid Access JWT payload',
        field: 'authorization',
      });
    }

    /*Если payload из JWT был валидирован, то возвращаем его и логин пользователя.*/
    return { id: payload.userId, login: user.login };
  }
}
