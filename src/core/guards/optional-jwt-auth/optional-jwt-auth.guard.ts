import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserJwtAuthContextDTO } from '../jwt-auth/dto/user-jwt-auth-context.dto';

/*Гард для опциональной авторизации по JWT, используя библиотеку Passport.js.*/
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  public handleRequest<TUser = UserJwtAuthContextDTO>(error: any, user: TUser): TUser | null {
    /*Если происходит ошибка валидации токена или пользователь не найден, то возвращаем null, чтобы запрос мог
    продолжиться без авторизации и выброса исключений.*/
    if (error || !user) return null;
    return user;
  }
}
