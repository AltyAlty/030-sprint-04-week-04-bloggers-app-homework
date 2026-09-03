import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Put, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CommentsService } from '../../application/comments/comments.service';
import { CommentsQueryService } from '../../application/comments/comments.query-service';
import { ErrorsMessagesSwaggerType } from '../../../../core/validation/types/errors-messages.type';
import { UpdateCommentInputDTO } from './input-dto/update-comment.input-dto';
import { UpdateCommentLikeStatusByIdInputDTO } from './input-dto/update-comment-like-status-by-id.input-dto';
import { CommentOutputDTO } from './output-dto/comment.output-dto';
import { UserJwtAuthContextDTO } from '../../../../core/guards/jwt-auth/dto/user-jwt-auth-context.dto';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../../../core/guards/optional-jwt-auth/optional-jwt-auth.guard';
import { SETTINGS } from '../../../../core/settings/settings';
import { ExtractUserDataFromRequest } from '../../../user/api/auth/decorators/param-extraction/extract-user-data-from-request.param-decorator';

/*Контроллер для комментариев.*/
@ApiTags('Comments')
@Controller(SETTINGS.COMMENTS_PREFIX)
export class CommentsController {
  public constructor(
    private readonly commentsQueryService: CommentsQueryService,
    private readonly commentsService: CommentsService
  ) {}

  /*001. GET-запрос по поиску комментария по ID, используя URI-параметры.*/
  @ApiOperation({ summary: 'Get a comment by ID. Bearer auth is optional to get personalized like status' })
  @ApiOkResponse({ type: CommentOutputDTO, description: 'Returns the comment' })
  @ApiNotFoundResponse({ description: 'The comment does not exist', type: ErrorsMessagesSwaggerType })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Comment ID', format: 'ObjectId' })
  @Get(SETTINGS.GET_COMMENT_BY_ID_PATH)
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  public async getCommentById(
    @Param('id') id: string,
    @ExtractUserDataFromRequest() userJwtAuthContext: UserJwtAuthContextDTO | null
  ): Promise<CommentOutputDTO> {
    /*Просим query-сервис "CommentsQueryService" найти комментарий по ID.*/
    return this.commentsQueryService.findById(id, userJwtAuthContext?.id);
  }

  /*002. PUT-запрос по изменению комментария по ID, используя URI-параметры.*/
  @ApiOperation({ summary: 'Update a comment by ID' })
  @ApiNoContentResponse({ description: 'The comment has been updated' })
  @ApiBadRequestResponse({ description: 'The input data is invalid', type: ErrorsMessagesSwaggerType })
  @ApiNotFoundResponse({ description: 'The comment does not exist', type: ErrorsMessagesSwaggerType })
  @ApiForbiddenResponse({ description: 'The user is not the owner of the comment', type: ErrorsMessagesSwaggerType })
  @ApiUnauthorizedResponse({
    description: 'The Access JWT is invalid or the user does not exist',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Comment ID', format: 'ObjectId' })
  @Put(SETTINGS.UPDATE_COMMENT_BY_ID_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  public async updateCommentById(
    @Param('id') id: string,
    @Body() body: UpdateCommentInputDTO,
    @ExtractUserDataFromRequest() userJwtAuthContext: UserJwtAuthContextDTO
  ): Promise<void> {
    /*Просим сервис "CommentsService" изменить комментарий по ID.*/
    await this.commentsService.updateById(id, body, userJwtAuthContext);
  }

  /*003. PUT-запрос по изменению статуса лайка комментария по ID комментария, используя URI-параметры.*/
  @ApiOperation({ summary: 'Update a comment like status by ID' })
  @ApiNoContentResponse({ description: 'The comment like status has been updated' })
  @ApiBadRequestResponse({ description: 'The input data is invalid', type: ErrorsMessagesSwaggerType })
  @ApiNotFoundResponse({ description: 'The comment does not exist', type: ErrorsMessagesSwaggerType })
  @ApiUnauthorizedResponse({
    description: 'The Access JWT is invalid or the user does not exist',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Comment ID', format: 'ObjectId' })
  @Put(SETTINGS.LIKE_COMMENT_BY_ID_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  public async updateCommentLikeStatusById(
    @Param('id') id: string,
    @Body() body: UpdateCommentLikeStatusByIdInputDTO,
    @ExtractUserDataFromRequest() userJwtAuthContext: UserJwtAuthContextDTO
  ): Promise<void> {
    /*Просим сервис "CommentsService" изменить статус лайка комментария по ID комментария.*/
    await this.commentsService.updateCommentLikeStatusById(id, body, userJwtAuthContext);
  }

  /*004. DELETE-запрос по удалению комментария по ID, используя URI-параметры.*/
  @ApiOperation({ summary: 'Delete a comment by ID' })
  @ApiNoContentResponse({ description: 'The comment has been deleted' })
  @ApiNotFoundResponse({ description: 'The comment does not exist', type: ErrorsMessagesSwaggerType })
  @ApiForbiddenResponse({ description: 'The user is not the owner of the comment', type: ErrorsMessagesSwaggerType })
  @ApiUnauthorizedResponse({
    description: 'The Access JWT is invalid or the user does not exist',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Comment ID', format: 'ObjectId' })
  @Delete(SETTINGS.DELETE_COMMENT_BY_ID_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  public async deleteCommentById(
    @Param('id') id: string,
    @ExtractUserDataFromRequest() userJwtAuthContext: UserJwtAuthContextDTO
  ): Promise<void> {
    /*Просим сервис "CommentsService" удалить комментарий по ID.*/
    await this.commentsService.deleteById(id, userJwtAuthContext);
  }
}
