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
import { ApiTags } from '@nestjs/swagger';
import { BlogsService } from '../../application/blogs/blogs.service';
import { PostsService } from '../../application/posts/posts.service';
import { BlogsQueryService } from '../../application/blogs/blogs.query-service';
import { PostsQueryService } from '../../application/posts/posts.query-service';
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
import { BlogsControllerSwaggerDecorators } from '../../../../core/swagger/decorators/blog-module/blogs-controller.swagger-decorators';
import { ExtractUserDataFromRequest } from '../../../user/api/auth/decorators/param-extraction/extract-user-data-from-request.param-decorator';

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
  @BlogsControllerSwaggerDecorators.createBlog
  @UseGuards(BasicAuthGuard)
  @Post(SETTINGS.CREATE_BLOG_PATH)
  @HttpCode(HttpStatus.CREATED)
  public async createBlog(@Body() body: CreateBlogInputDTO): Promise<BlogOutputDTO> {
    /*Просим сервис "BlogsService" создать блог.*/
    return this.blogsService.create(body);
  }

  /*002. POST-запрос по созданию поста в блоге.*/
  @BlogsControllerSwaggerDecorators.createPostForBlog
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
  @BlogsControllerSwaggerDecorators.getBlogById
  @Get(SETTINGS.GET_BLOG_BY_ID_PATH)
  @HttpCode(HttpStatus.OK)
  public async getBlogById(@Param('id') id: string): Promise<BlogOutputDTO> {
    /*Просим query-сервис "BlogsQueryService" найти блог по ID.*/
    return this.blogsQueryService.findById(id);
  }

  /*004. GET-запрос по поиску блогов с пагинацией, используя query-параметры.*/
  @BlogsControllerSwaggerDecorators.getBlogList
  @Get(SETTINGS.GET_BLOG_LIST_PATH)
  @HttpCode(HttpStatus.OK)
  public async getBlogList(
    @Query() query: GetBlogListQueryInputDTO
  ): Promise<PaginationMetaDataOutputDTO<BlogListOutputDTO>> {
    /*Просим query-сервис "BlogsQueryService" найти блоги.*/
    return this.blogsQueryService.findAll(query);
  }

  /*005. GET-запрос по поиску постов с пагинацией по ID блога, используя query-параметры.*/
  @BlogsControllerSwaggerDecorators.getPostListByBlogId
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
  @BlogsControllerSwaggerDecorators.updateBlogById
  @UseGuards(BasicAuthGuard)
  @Put(SETTINGS.UPDATE_BLOG_BY_ID_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async updateBlogById(@Param('id') id: string, @Body() body: UpdateBlogInputDTO): Promise<void> {
    /*Просим сервис "BlogsService" изменить блог по ID.*/
    await this.blogsService.updateById(id, body);
  }

  /*007. DELETE-запрос по удалению блога по ID, используя URI-параметры.*/
  @BlogsControllerSwaggerDecorators.deleteBlogById
  @UseGuards(BasicAuthGuard)
  @Delete(SETTINGS.DELETE_BLOG_BY_ID_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteBlogById(@Param('id') id: string): Promise<void> {
    /*Просим сервис "BlogsService" удалить блог по ID.*/
    await this.blogsService.deleteById(id);
  }
}
