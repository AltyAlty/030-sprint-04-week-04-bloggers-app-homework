import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DomainException, DomainExceptionCode } from '../../exceptions/domain/domain.exception';
import { UserJwtAuthContextDTO } from './dto/user-jwt-auth-context.dto';

/*Гард для авторизации по JWT, используя библиотеку Passport.js.*/
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /*Метод "handleRequest()" вызывается автоматически при перехвате ошибки валидации выброшенной либо библиотекой
  Passport.js, либо методом "validate()" из стратегии, или после успешной работы метода "validate()" из стратегии,
  получив от него объект с данными пользователя.

  Первым параметром метод "handleRequest()" получает ошибку валидации JWT от библиотеки Passport.js, вторым
  параметром - результат работы метода "validate()", третьим параметром - дополнительную информацию от библиотеки
  Passport.js, например, причину, почему токен невалиден, четвертым параметром - экземпляр интерфейса "ExecutionContext"
  для доступа к объектам запроса и ответа, пятым параметром - HTTP-статус, если стратегия вернула таковой.
  Результат работы этого метода будет помещен в свойство "user" объекта запроса, то есть в объект "req.user".*/
  public handleRequest<TUser = UserJwtAuthContextDTO>(error: any, user: TUser): TUser {
    if (error instanceof DomainException) throw error;

    if (error || !user) {
      throw new DomainException({
        code: DomainExceptionCode.InvalidAccessJwt,
        message: 'Invalid Access JWT',
        field: 'authorization',
      });
    }

    return user;
  }
}
