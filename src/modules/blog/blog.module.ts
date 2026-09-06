import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { BlogsController } from './api/blogs/blogs.controller';
import { CommentsController } from './api/comments/comments.controller';
import { PostsController } from './api/posts/posts.controller';
import { BlogsService } from './application/blogs/blogs.service';
import { CommentsService } from './application/comments/comments.service';
import { PostsService } from './application/posts/posts.service';
import { BlogsQueryService } from './application/blogs/blogs.query-service';
import { CommentsQueryService } from './application/comments/comments.query-service';
import { PostsQueryService } from './application/posts/posts.query-service';
import { BlogsRepository } from './infrastructure/blogs/blogs.repository';
import { CommentsRepository } from './infrastructure/comments/comments.repository';
import { PostsRepository } from './infrastructure/posts/posts.repository';
import { BlogsQueryRepository } from './infrastructure/blogs/blogs.query-repository';
import { CommentsQueryRepository } from './infrastructure/comments/comments.query-repository';
import { PostsQueryRepository } from './infrastructure/posts/posts.query-repository';
import { UserModule } from '../user/user.module';
import { Blog, BlogSchema } from './domain/blogs/blog.entity';
import { Comment, CommentSchema } from './domain/comments/comment.entity';
import { CommentLikeData, CommentLikeDataSchema } from './domain/comments/comment-like-data.entity';
import { Post, PostSchema } from './domain/posts/post.entity';
import { PostLikeData, PostLikeDataSchema } from './domain/posts/post-like-data.entity';

/*Модуль для блогов, постов и комментариев.*/
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: PostLikeData.name, schema: PostLikeDataSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: CommentLikeData.name, schema: CommentLikeDataSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'access-jwt' }),
    UserModule,
  ],
  controllers: [BlogsController, PostsController, CommentsController],
  providers: [
    BlogsService,
    BlogsQueryService,
    BlogsRepository,
    BlogsQueryRepository,
    PostsService,
    PostsQueryService,
    PostsRepository,
    PostsQueryRepository,
    CommentsService,
    CommentsQueryService,
    CommentsRepository,
    CommentsQueryRepository,
  ],
})
export class BlogModule {}
