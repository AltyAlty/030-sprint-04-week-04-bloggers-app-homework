import { ApiProperty } from '@nestjs/swagger';

/*Output DTO для получения данных пользователя при предоставлении AT.*/
export class GetAuthUserDataByAccessTokenOutputDTO {
  @ApiProperty({ example: '60d5ec386f6e5a1b3c9d4e2a', description: 'User ID' })
  public userId: string;

  @ApiProperty({ example: 'userLogin', description: 'User login' })
  public login: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  public email: string;
}
