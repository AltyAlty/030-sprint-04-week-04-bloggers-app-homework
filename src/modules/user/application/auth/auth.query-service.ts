import { Injectable } from '@nestjs/common';
import { UsersQueryService } from '../users/users.query-service';
import { DomainException, DomainExceptionCode } from '../../../../core/exceptions/domain/domain.exception';
import { UserJwtAuthContextDTO } from '../../../../core/guards/jwt-auth/dto/user-jwt-auth-context.dto';
import { UserDocumentType } from '../../domain/users/document-types/user.document-type';
import { AuthUserDataDTO } from './dto/auth-user-data.dto';

/*Query-сервис для работы с аутентификацией и авторизацией.*/
@Injectable()
export class AuthQueryService {
  public constructor(private readonly usersQueryService: UsersQueryService) {}

  /*Метод для получения данных о пользователе по ID пользователя при предоставлении AT.*/
  public async getAuthUserDataByUserId(userJwtAuthContext: UserJwtAuthContextDTO): Promise<AuthUserDataDTO> {
    /*Просим query-сервис "usersQueryService" найти пользователя по ID без выброса исключений.*/
    const user: UserDocumentType | null = await this.usersQueryService.findByIdWithoutExceptions(userJwtAuthContext.id);

    /*Если пользователь не был найден, то выбрасываем исключение с информацией об этом.*/
    if (!user)
      throw new DomainException({
        code: DomainExceptionCode.UserNotFoundWhileGettingAuthData,
        message: 'User to get auth data not found',
        field: 'id',
      });

    /*Если пользователь был найден, то возвращаем данные о нем.*/
    return { userId: user.id, email: user.email, login: user.login };
  }
}
