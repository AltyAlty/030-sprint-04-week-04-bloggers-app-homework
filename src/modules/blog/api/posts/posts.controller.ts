import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBasicAuth,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CommentsService } from '../../application/comments/comments.service';
import { PostsService } from '../../application/posts/posts.service';
import { CommentsQueryService } from '../../application/comments/comments.query-service';
import { PostsQueryService } from '../../application/posts/posts.query-service';
import { ErrorsMessagesSwaggerType } from '../../../../core/validation/types/errors-messages.type';
import { CreateCommentForPostInputDTO } from './input-dto/create-comment-for-post.input-dto';
import { CreatePostInputDTO } from './input-dto/create-post.input-dto';
import { GetCommentListByPostIdQueryInputDTO } from './input-dto/query/get-comment-list-by-post-id-query.input-dto';
import { GetPostListQueryInputDTO } from './input-dto/query/get-post-list-query.input-dto';
import { UpdatePostInputDTO } from './input-dto/update-post.input-dto';
import { UpdatePostLikeStatusByIdInputDTO } from './input-dto/update-post-like-status-by-id.input-dto';
import { PaginationMetaDataOutputDTO } from '../../../../core/pagination/output-dto/pagination-meta-data.output-dto';
import { CommentOutputDTO } from '../comments/output-dto/comment.output-dto';
import { CommentListOutputDTO } from '../comments/output-dto/comment-list.output-dto';
import { PostOutputDTO } from './output-dto/post.output-dto';
import { PostListOutputDTO } from './output-dto/post-list.output-dto';
import { AccessJwtAuthGuard } from '../../../../core/guards/access-jwt-auth/access-jwt-auth.guard';
import { UserAccessJwtAuthContextDTO } from '../../../../core/guards/access-jwt-auth/dto/user-access-jwt-auth-context.dto';
import { BasicAuthGuard } from '../../../../core/guards/basic-auth/basic-auth.guard';
import { OptionalAccessJwtAuthGuard } from '../../../../core/guards/optional-access-jwt-auth/optional-access-jwt-auth.guard';
import { SETTINGS } from '../../../../core/settings/settings';
import { ExtractUserDataFromRequest } from '../../../user/api/auth/decorators/param-extraction/extract-user-data-from-request.param-decorator';
import { PaginatedCommentListSwaggerOutputDTO } from '../comments/output-dto/paginated-comment-list.swagger-output-dto';
import { PaginatedPostListSwaggerOutputDTO } from './output-dto/paginated-post-list.swagger-output-dto';

/*Контроллер для постов.*/
@ApiTags(SETTINGS.POSTS_API_TAG)
@Controller(SETTINGS.POSTS_PREFIX)
export class PostsController {
  public constructor(
    private readonly postsService: PostsService,
    private readonly postsQueryService: PostsQueryService,
    private readonly commentsService: CommentsService,
    private readonly commentsQueryService: CommentsQueryService
  ) {}

  /*001. POST-запрос по созданию поста.*/
  @ApiOperation({ summary: 'Create a post' })
  @ApiCreatedResponse({ description: 'Returns the created post', type: PostOutputDTO })
  @ApiBadRequestResponse({ description: 'The input data is invalid', type: ErrorsMessagesSwaggerType })
  @ApiNotFoundResponse({ description: 'The blog does not exist', type: ErrorsMessagesSwaggerType })
  @ApiUnauthorizedResponse({
    description: 'Wrong authorization type or the basic auth credentials are incorrect',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiBasicAuth()
  @UseGuards(BasicAuthGuard)
  @Post(SETTINGS.CREATE_POST_PATH)
  @HttpCode(HttpStatus.CREATED)
  public async createPost(@Body() body: CreatePostInputDTO): Promise<PostOutputDTO> {
    /*Просим сервис "PostsService" создать пост.*/
    return this.postsService.create(body);
  }

  /*002. POST-запрос по созданию комментария в посте.*/
  @ApiOperation({ summary: 'Create a comment for a post' })
  @ApiCreatedResponse({ description: 'Returns the created comment', type: CommentOutputDTO })
  @ApiBadRequestResponse({ description: 'The input data is invalid', type: ErrorsMessagesSwaggerType })
  @ApiNotFoundResponse({ description: 'The post does not exist', type: ErrorsMessagesSwaggerType })
  @ApiUnauthorizedResponse({
    description: 'The Access JWT is invalid or the user does not exist',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiBearerAuth()
  @UseGuards(AccessJwtAuthGuard)
  @Post(SETTINGS.CREATE_COMMENT_FOR_POST_PATH)
  @HttpCode(HttpStatus.CREATED)
  public async createCommentForPost(
    @Param('postId') id: string,
    @Body() body: CreateCommentForPostInputDTO,
    @ExtractUserDataFromRequest() userJwtAccessAuthContext: UserAccessJwtAuthContextDTO
  ): Promise<CommentOutputDTO> {
    /*Просим сервис "CommentsService" создать комментарий в посте.*/
    return this.commentsService.createForPost(id, body, userJwtAccessAuthContext);
  }

  /*003. GET-запрос по поиску поста по ID, используя URI-параметры.*/
  @ApiOperation({ summary: 'Get a post by ID. Bearer auth is optional to get personalized like status' })
  @ApiOkResponse({ description: 'Returns the post', type: PostOutputDTO })
  @ApiNotFoundResponse({ description: 'The post does not exist', type: ErrorsMessagesSwaggerType })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Post ID', format: 'ObjectId' })
  @UseGuards(OptionalAccessJwtAuthGuard)
  @Get(SETTINGS.GET_POST_BY_ID_PATH)
  @HttpCode(HttpStatus.OK)
  public async getPostById(
    @Param('id') id: string,
    @ExtractUserDataFromRequest() userAccessJwtAuthContext: UserAccessJwtAuthContextDTO | null
  ): Promise<PostOutputDTO> {
    /*Просим query-сервис "PostsQueryService" найти пост по ID.*/
    return this.postsQueryService.findById(id, userAccessJwtAuthContext?.id);
  }

  /*004. GET-запрос по поиску постов с пагинацией, используя query-параметры.*/
  @ApiOperation({ summary: 'Get a paginated list of posts. Bearer auth is optional to get personalized like statuses' })
  @ApiOkResponse({ description: 'Returns a paginated list of posts', type: PaginatedPostListSwaggerOutputDTO })
  @ApiNotFoundResponse({ description: 'The blog does not exist', type: ErrorsMessagesSwaggerType })
  @ApiBearerAuth()
  @UseGuards(OptionalAccessJwtAuthGuard)
  @Get(SETTINGS.GET_POST_LIST_PATH)
  @HttpCode(HttpStatus.OK)
  public async getPostList(
    @Query() query: GetPostListQueryInputDTO,
    @ExtractUserDataFromRequest() userAccessJwtAuthContext: UserAccessJwtAuthContextDTO | null
  ): Promise<PaginationMetaDataOutputDTO<PostListOutputDTO>> {
    /*Просим query-сервис "PostsQueryService" найти посты.*/
    return this.postsQueryService.findAll(query, undefined, userAccessJwtAuthContext?.id);
  }

  /*005. GET-запрос по поиску комментариев с пагинацией по ID поста, используя query-параметры.*/
  @ApiOperation({
    summary: 'Get a paginated list of comments by post ID. Bearer auth is optional to get personalized like statuses',
  })
  @ApiOkResponse({ description: 'Returns a paginated list of comments', type: PaginatedCommentListSwaggerOutputDTO })
  @ApiNotFoundResponse({ description: 'The post does not exist', type: ErrorsMessagesSwaggerType })
  @ApiBearerAuth()
  @ApiParam({ name: 'postId', description: 'Post ID', format: 'ObjectId' })
  @UseGuards(OptionalAccessJwtAuthGuard)
  @Get(SETTINGS.GET_COMMENT_LIST_BY_POST_ID_PATH)
  @HttpCode(HttpStatus.OK)
  public async getCommentListByPostId(
    @Param('postId') id: string,
    @Query() query: GetCommentListByPostIdQueryInputDTO,
    @ExtractUserDataFromRequest() userAccessJwtAuthContext: UserAccessJwtAuthContextDTO | null
  ): Promise<PaginationMetaDataOutputDTO<CommentListOutputDTO>> {
    /*Просим query-сервис "CommentsQueryService" найти комментарии по ID поста.*/
    return this.commentsQueryService.findAllByPostId(id, query, userAccessJwtAuthContext?.id);
  }

  /*006. PUT-запрос по изменению поста по ID, используя URI-параметры.*/
  @ApiOperation({ summary: 'Update a post by ID' })
  @ApiNoContentResponse({ description: 'Updates the post' })
  @ApiBadRequestResponse({ description: 'The input data is invalid', type: ErrorsMessagesSwaggerType })
  @ApiNotFoundResponse({ description: 'The post does not exist', type: ErrorsMessagesSwaggerType })
  @ApiUnauthorizedResponse({
    description: 'Wrong authorization type or the basic auth credentials are incorrect',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiBasicAuth()
  @ApiParam({ name: 'id', description: 'Post ID', format: 'ObjectId' })
  @UseGuards(BasicAuthGuard)
  @Put(SETTINGS.UPDATE_POST_BY_ID_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async updatePostById(@Param('id') id: string, @Body() body: UpdatePostInputDTO): Promise<void> {
    /*Просим сервис "PostsService" изменить пост по ID.*/
    await this.postsService.updateById(id, body);
  }

  /*007. PUT-запрос по изменению статуса лайка поста по ID поста, используя URI-параметры.*/
  @ApiOperation({ summary: 'Update a post like status by ID' })
  @ApiNoContentResponse({ description: 'Updates the post like status' })
  @ApiBadRequestResponse({ description: 'The input data is invalid', type: ErrorsMessagesSwaggerType })
  @ApiNotFoundResponse({ description: 'The post does not exist', type: ErrorsMessagesSwaggerType })
  @ApiUnauthorizedResponse({
    description: 'The Access JWT is invalid or the user does not exist',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Post ID', format: 'ObjectId' })
  @UseGuards(AccessJwtAuthGuard)
  @Put(SETTINGS.LIKE_POST_BY_ID_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async updatePostLikeStatusById(
    @Param('id') id: string,
    @Body() body: UpdatePostLikeStatusByIdInputDTO,
    @ExtractUserDataFromRequest() userAccessJwtAuthContext: UserAccessJwtAuthContextDTO
  ): Promise<void> {
    /*Просим сервис "PostsService" изменить статус лайка поста по ID поста.*/
    await this.postsService.updatePostLikeStatusById(id, body, userAccessJwtAuthContext);
  }

  /*008. DELETE-запрос по удалению поста по ID, используя URI-параметры.*/
  @ApiOperation({ summary: 'Delete a post by ID' })
  @ApiNoContentResponse({ description: 'Deletes the post' })
  @ApiNotFoundResponse({ description: 'The post does not exist', type: ErrorsMessagesSwaggerType })
  @ApiUnauthorizedResponse({
    description: 'Wrong authorization type or the basic auth credentials are incorrect',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiParam({ name: 'id', description: 'Post ID', format: 'ObjectId' })
  @ApiBasicAuth()
  @UseGuards(BasicAuthGuard)
  @Delete(SETTINGS.DELETE_POST_BY_ID_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deletePostById(@Param('id') id: string): Promise<void> {
    /*Просим сервис "PostsService" удалить пост по ID.*/
    await this.postsService.deleteById(id);
  }
}
