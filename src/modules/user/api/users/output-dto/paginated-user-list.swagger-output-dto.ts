import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDataOutputDTO } from '../../../../../core/pagination/output-dto/pagination-meta-data.output-dto';
import { UserOutputDTO } from './user.output-dto';
import { UserListOutputDTO } from './user-list.output-dto';

/*Output DTO для списка пользователей с пагинацией для Swagger-документации, так как для Swagger нужен именно класс, а
не просто тип.*/
export class PaginatedUserListSwaggerOutputDTO extends PaginationMetaDataOutputDTO<UserListOutputDTO> {
  @ApiProperty({ type: [UserOutputDTO] })
  public items: UserOutputDTO[];
}
