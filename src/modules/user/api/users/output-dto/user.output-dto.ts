import { ApiProperty } from '@nestjs/swagger';
import { UserListOutputDTO } from './user-list.output-dto';
import { UserDocumentType } from '../../../domain/users/document-types/user.document-type';
import { UserListDocumentType } from '../../../domain/users/document-types/user-list.document-type';

/*Output DTO для пользователя.*/
export class UserOutputDTO {
  @ApiProperty({ example: '60d5ec386f6e5a1b3c9d4e2a', description: 'User ID' })
  public id: string;

  @ApiProperty({ example: 'userLogin', description: 'User login' })
  public login: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  public email: string;

  @ApiProperty({ example: '2026-08-28T04:16:49.315Z', description: 'User registration date' })
  public createdAt: Date;

  /*Маппер для преобразования пользователя из БД в подготовленного для отправки клиенту пользователя.*/
  public static mapFromUserDocumentTypeToUserOutputDTO(user: UserDocumentType): UserOutputDTO {
    const userOutputDTO: UserOutputDTO = new UserOutputDTO();
    userOutputDTO.id = user._id.toString();
    userOutputDTO.login = user.login;
    userOutputDTO.email = user.email;
    userOutputDTO.createdAt = user.createdAt;
    return userOutputDTO;
  }

  /*Маппер для преобразования пользователей из БД в подготовленных для отправки клиенту пользователей.*/
  public static mapFromUserListDocumentTypeToUserListOutputDTO(users: UserListDocumentType): UserListOutputDTO {
    return users.map((user: UserDocumentType) => {
      return this.mapFromUserDocumentTypeToUserOutputDTO(user);
    });
  }
}
