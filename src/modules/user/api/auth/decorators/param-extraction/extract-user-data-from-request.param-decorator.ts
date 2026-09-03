import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserLocalAuthContextDTO } from '../../../../../../core/guards/local-auth/dto/user-local-auth-context.dto';

/*Кастомный декоратор для получения из объекта запроса данных о пользователе.*/
export const ExtractUserDataFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserLocalAuthContextDTO => {
    /*Получаем объект запроса.*/
    const request: Request = context.switchToHttp().getRequest<Request>();
    /*Получаем данные о пользователе и возвращаем их.*/
    return request.user as UserLocalAuthContextDTO;
  }
);
