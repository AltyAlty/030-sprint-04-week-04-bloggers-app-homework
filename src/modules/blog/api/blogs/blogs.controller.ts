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
import { BlogsService } from '../../application/blogs/blogs.service';
import { PostsService } from '../../application/posts/posts.service';
import { BlogsQueryService } from '../../application/blogs/blogs.query-service';
import { PostsQueryService } from '../../application/posts/posts.query-service';
import { ErrorsMessagesSwaggerType } from '../../../../core/validation/types/errors-messages.type';
import { CreateBlogInputDTO } from './input-dto/create-blog.input-dto';
import { CreatePostForBlogInputDTO } from './input-dto/create-post-for-blog.input-dto';
import { GetBlogListQueryInputDTO } from './input-dto/query/get-blog-list-query.input-dto';
import { GetPostListByBlogIdQueryInputDTO } from './input-dto/query/get-post-list-by-blog-id-query.input-dto';
import { UpdateBlogInputDTO } from './input-dto/update-blog.input-dto';
import { PaginationMetaDataOutputDTO } from '../../../../core/pagination/output-dto/pagination-meta-data.output-dto';
import { PostOutputDTO } from '../posts/output-dto/post.output-dto';
import { PostListOutputDTO } from '../posts/output-dto/post-list.output-dto';
import { BlogOutputDTO } from './output-dto/blog.output-dto';
import { BlogListOutputDTO } from './output-dto/blog-list.output-dto';
import { UserAccessJwtAuthContextDTO } from '../../../../core/guards/access-jwt-auth/dto/user-access-jwt-auth-context.dto';
import { BasicAuthGuard } from '../../../../core/guards/basic-auth/basic-auth.guard';
import { OptionalAccessJwtAuthGuard } from '../../../../core/guards/optional-access-jwt-auth/optional-access-jwt-auth.guard';
import { SETTINGS } from '../../../../core/settings/settings';
import { ExtractUserDataFromRequest } from '../../../user/api/auth/decorators/param-extraction/extract-user-data-from-request.param-decorator';
import { PaginatedPostListSwaggerOutputDTO } from '../posts/output-dto/paginated-post-list.swagger-output-dto';
import { PaginatedBlogListSwaggerOutputDTO } from './output-dto/paginated-blog-list.swagger-output-dto';

/*Контроллер для блогов.*/
@ApiTags(SETTINGS.BLOGS_API_TAG)
@Controller(SETTINGS.BLOGS_PREFIX)
export class BlogsController {
  public constructor(
    private readonly blogsService: BlogsService,
    private readonly blogsQueryService: BlogsQueryService,
    private readonly postsService: PostsService,
    private readonly postsQueryService: PostsQueryService
  ) {}

  /*001. POST-запрос по созданию блога.*/
  @ApiOperation({ summary: 'Create a blog' })
  @ApiCreatedResponse({ description: 'Returns the created blog', type: BlogOutputDTO })
  @ApiBadRequestResponse({ description: 'The input data is invalid', type: ErrorsMessagesSwaggerType })
  @ApiUnauthorizedResponse({
    description: 'Wrong authorization type or the basic auth credentials are incorrect',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiBasicAuth()
  @UseGuards(BasicAuthGuard)
  @Post(SETTINGS.CREATE_BLOG_PATH)
  @HttpCode(HttpStatus.CREATED)
  public async createBlog(@Body() body: CreateBlogInputDTO): Promise<BlogOutputDTO> {
    /*Просим сервис "BlogsService" создать блог.*/
    return this.blogsService.create(body);
  }

  /*002. POST-запрос по созданию поста в блоге.*/
  @ApiOperation({ summary: 'Create a post for a blog' })
  @ApiCreatedResponse({ description: 'Returns the created post', type: PostOutputDTO })
  @ApiBadRequestResponse({ description: 'The input data is invalid', type: ErrorsMessagesSwaggerType })
  @ApiNotFoundResponse({ description: 'The blog does not exist', type: ErrorsMessagesSwaggerType })
  @ApiUnauthorizedResponse({
    description: 'Wrong authorization type or the basic auth credentials are incorrect',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiBasicAuth()
  @ApiParam({ name: 'blogId', description: 'Blog ID', format: 'ObjectId' })
  @UseGuards(BasicAuthGuard)
  @Post(SETTINGS.CREATE_POST_FOR_BLOG_PATH)
  @HttpCode(HttpStatus.CREATED)
  public async createPostForBlog(
    @Param('blogId') id: string,
    @Body() body: CreatePostForBlogInputDTO
  ): Promise<PostOutputDTO> {
    /*Просим сервис "PostsService" создать пост в блоге.*/
    return this.postsService.createForBlog(body, id);
  }

  /*003. GET-запрос по поиску блога по ID, используя URI-параметры.*/
  @ApiOperation({ summary: 'Get a blog by ID' })
  @ApiOkResponse({ type: BlogOutputDTO, description: 'Returns the blog' })
  @ApiNotFoundResponse({ description: 'The blog does not exist', type: ErrorsMessagesSwaggerType })
  @ApiParam({ name: 'id', description: 'Blog ID', format: 'ObjectId' })
  @Get(SETTINGS.GET_BLOG_BY_ID_PATH)
  @HttpCode(HttpStatus.OK)
  public async getBlogById(@Param('id') id: string): Promise<BlogOutputDTO> {
    /*Просим query-сервис "BlogsQueryService" найти блог по ID.*/
    return this.blogsQueryService.findById(id);
  }

  /*004. GET-запрос по поиску блогов с пагинацией, используя query-параметры.*/
  @ApiOperation({ summary: 'Get a paginated list of blogs' })
  @ApiOkResponse({ description: 'Returns a paginated list of blogs', type: PaginatedBlogListSwaggerOutputDTO })
  @Get(SETTINGS.GET_BLOG_LIST_PATH)
  @HttpCode(HttpStatus.OK)
  public async getBlogList(
    @Query() query: GetBlogListQueryInputDTO
  ): Promise<PaginationMetaDataOutputDTO<BlogListOutputDTO>> {
    /*Просим query-сервис "BlogsQueryService" найти блоги.*/
    return this.blogsQueryService.findAll(query);
  }

  /*005. GET-запрос по поиску постов с пагинацией по ID блога, используя query-параметры.*/
  @ApiOperation({
    summary: 'Get a paginated list of posts by blog ID. Bearer auth is optional to get personalized like statuses',
  })
  @ApiOkResponse({ type: PaginatedPostListSwaggerOutputDTO, description: 'Returns a paginated list of posts' })
  @ApiNotFoundResponse({ description: 'The blog does not exist', type: ErrorsMessagesSwaggerType })
  @ApiBearerAuth()
  @ApiParam({ name: 'blogId', description: 'Blog ID', format: 'ObjectId' })
  @UseGuards(OptionalAccessJwtAuthGuard)
  @Get(SETTINGS.GET_POST_LIST_BY_BLOG_ID_PATH)
  @HttpCode(HttpStatus.OK)
  public async getPostListByBlogId(
    @Param('blogId') id: string,
    @Query() query: GetPostListByBlogIdQueryInputDTO,
    @ExtractUserDataFromRequest() userAccessJwtAuthContext: UserAccessJwtAuthContextDTO | null
  ): Promise<PaginationMetaDataOutputDTO<PostListOutputDTO>> {
    /*Просим query-сервис "PostsQueryService" найти посты по ID блога.*/
    return this.postsQueryService.findAll(query, id, userAccessJwtAuthContext?.id);
  }

  /*006. PUT-запрос по изменению блога по ID, используя URI-параметры.*/
  @ApiOperation({ summary: 'Update a blog by ID' })
  @ApiNoContentResponse({ description: 'Updates the blog' })
  @ApiBadRequestResponse({ description: 'The input data is invalid', type: ErrorsMessagesSwaggerType })
  @ApiNotFoundResponse({ description: 'The blog does not exist', type: ErrorsMessagesSwaggerType })
  @ApiUnauthorizedResponse({
    description: 'Wrong authorization type or the basic auth credentials are incorrect',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiBasicAuth()
  @ApiParam({ name: 'id', description: 'Blog ID', format: 'ObjectId' })
  @UseGuards(BasicAuthGuard)
  @Put(SETTINGS.UPDATE_BLOG_BY_ID_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async updateBlogById(@Param('id') id: string, @Body() body: UpdateBlogInputDTO): Promise<void> {
    /*Просим сервис "BlogsService" изменить блог по ID.*/
    await this.blogsService.updateById(id, body);
  }

  /*007. DELETE-запрос по удалению блога по ID, используя URI-параметры.*/
  @ApiOperation({ summary: 'Delete a blog by ID' })
  @ApiNoContentResponse({ description: 'Deletes the blog' })
  @ApiNotFoundResponse({ description: 'The blog does not exist', type: ErrorsMessagesSwaggerType })
  @ApiUnauthorizedResponse({
    description: 'Wrong authorization type or the basic auth credentials are incorrect',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiBasicAuth()
  @ApiParam({ name: 'id', description: 'Blog ID', format: 'ObjectId' })
  @UseGuards(BasicAuthGuard)
  @Delete(SETTINGS.DELETE_BLOG_BY_ID_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteBlogById(@Param('id') id: string): Promise<void> {
    /*Просим сервис "BlogsService" удалить блог по ID.*/
    await this.blogsService.deleteById(id);
  }
}
