import { Injectable } from '@nestjs/common';
import { UsersQueryRepository } from '../../infrastructure/users/users.query-repository';
import { GetUserListQueryInputDTO } from '../../api/users/input-dto/query/get-user-list-query.input-dto';
import { PaginationMetaDataOutputDTO } from '../../../../core/pagination/output-dto/pagination-meta-data.output-dto';
import { UserOutputDTO } from '../../api/users/output-dto/user.output-dto';
import { UserListOutputDTO } from '../../api/users/output-dto/user-list.output-dto';
import { UserDocumentType } from '../../domain/users/document-types/user.document-type';
import { UserListDocumentType } from '../../domain/users/document-types/user-list.document-type';

/*Query-сервис для пользователей.*/
@Injectable()
export class UsersQueryService {
  public constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  /*Метод для поиска пользователя по ID без выброса исключений.*/
  public async findByIdWithoutExceptions(id: string): Promise<UserDocumentType | null> {
    /*Просим query-репозиторий "usersQueryRepository" найти пользователя по ID в БД.*/
    return await this.usersQueryRepository.findById(id);
  }

  /*Метод для поиска пользователей.*/
  public async findAll(dto: GetUserListQueryInputDTO): Promise<PaginationMetaDataOutputDTO<UserListOutputDTO>> {
    /*Просим query-репозиторий "UsersQueryRepository" найти пользователей в БД.*/
    const { items, totalCount }: { items: UserListDocumentType; totalCount: number } =
      await this.usersQueryRepository.findAll(dto);

    /*Преобразовываем пользователей из БД в подготовленных для отправки клиенту пользователей.*/
    const userListOutput: UserListOutputDTO = UserOutputDTO.mapFromUserListDocumentTypeToUserListOutputDTO(items);

    /*Преобразовываем подготовленных для отправки клиенту пользователей в подготовленных для отправки клиенту с
    пагинацией пользователей и возвращаем их.*/
    return PaginationMetaDataOutputDTO.mapToOutputDTO({
      page: dto.pageNumber,
      pageSize: dto.pageSize,
      totalCount: totalCount,
      items: userListOutput,
    });
  }
}
