import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBasicAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from '../../application/users/users.service';
import { UsersQueryService } from '../../application/users/users.query-service';
import { ErrorsMessagesSwaggerType } from '../../../../core/validation/types/errors-messages.type';
import { CreateUserInputDTO } from './input-dto/create-user.input-dto';
import { GetUserListQueryInputDTO } from './input-dto/query/get-user-list-query.input-dto';
import { PaginationMetaDataOutputDTO } from '../../../../core/pagination/output-dto/pagination-meta-data.output-dto';
import { UserOutputDTO } from './output-dto/user.output-dto';
import { UserListOutputDTO } from './output-dto/user-list.output-dto';
import { BasicAuthGuard } from '../../../../core/guards/basic-auth/basic-auth.guard';
import { SETTINGS } from '../../../../core/settings/settings';
import { PaginatedUserListSwaggerOutputDTO } from './output-dto/paginated-user-list.swagger-output-dto';

/*Контроллер для пользователей.*/
@ApiTags(SETTINGS.USERS_API_TAG)
@ApiBasicAuth()
/*Подключаем гард для basic авторизации ко всем методам контроллера.*/
@UseGuards(BasicAuthGuard)
@Controller(SETTINGS.USERS_PREFIX)
export class UsersController {
  public constructor(
    private readonly usersService: UsersService,
    private readonly usersQueryService: UsersQueryService
  ) {}

  /*001. POST-запрос по созданию пользователя.*/
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({ type: UserOutputDTO, description: 'Returns the created user' })
  @ApiBadRequestResponse({
    description: 'The input data is invalid or the user already exists',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiUnauthorizedResponse({
    description: 'Wrong authorization type or the basic auth credentials are incorrect',
    type: ErrorsMessagesSwaggerType,
  })
  @Post(SETTINGS.CREATE_USER_PATH)
  @HttpCode(HttpStatus.CREATED)
  public async createUser(@Body() body: CreateUserInputDTO): Promise<UserOutputDTO> {
    /*Просим сервис "UsersService" создать пользователя.*/
    return this.usersService.createConfirmedUser(body);
  }

  /*002. GET-запрос по поиску пользователей с пагинацией, используя query-параметры.*/
  @ApiOperation({ summary: 'Get a paginated list of users' })
  @ApiOkResponse({
    description: 'Returns a paginated list of users',
    type: PaginatedUserListSwaggerOutputDTO,
  })
  @ApiUnauthorizedResponse({
    description: 'Wrong authorization type or the basic auth credentials are incorrect',
    type: ErrorsMessagesSwaggerType,
  })
  @Get(SETTINGS.GET_USER_LIST_PATH)
  @HttpCode(HttpStatus.OK)
  public async getUserList(
    @Query() query: GetUserListQueryInputDTO
  ): Promise<PaginationMetaDataOutputDTO<UserListOutputDTO>> {
    /*Просим query-сервис "UsersQueryService" найти пользователей.*/
    return this.usersQueryService.findAll(query);
  }

  /*003. DELETE-запрос по удалению пользователя по ID, используя URI-параметры.*/
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiNoContentResponse({ description: 'Deletes the user' })
  @ApiNotFoundResponse({ description: 'The user does not exist', type: ErrorsMessagesSwaggerType })
  @ApiUnauthorizedResponse({
    description: 'Wrong authorization type or the basic auth credentials are incorrect',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiParam({ name: 'id', description: 'User ID', format: 'ObjectId' })
  @Delete(SETTINGS.DELETE_USER_BY_ID_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteUserById(@Param('id') id: string): Promise<void> {
    /*Просим сервис "UsersService" удалить пользователя по ID.*/
    await this.usersService.deleteById(id);
  }
}
