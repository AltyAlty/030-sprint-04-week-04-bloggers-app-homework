import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Blog } from '../../modules/blog/domain/blogs/blog.entity';
import type { BlogModelType } from '../../modules/blog/domain/blogs/model-types/blog.model-type';
import { Comment } from '../../modules/blog/domain/comments/comment.entity';
import { CommentLikeData } from '../../modules/blog/domain/comments/comment-like-data.entity';
import type { CommentModelType } from '../../modules/blog/domain/comments/model-types/comment.model-type';
import type { CommentLikeDataModelType } from '../../modules/blog/domain/comments/model-types/comment-like-data.model-type';
import type { PostModelType } from '../../modules/blog/domain/posts/model-types/post.model-type';
import type { PostLikeDataModelType } from '../../modules/blog/domain/posts/model-types/post-like-data.model-type';
import { Post } from '../../modules/blog/domain/posts/post.entity';
import { PostLikeData } from '../../modules/blog/domain/posts/post-like-data.entity';
import { EmailConfirmation } from '../../modules/user/domain/auth/email-confirmation.entity';
import type { EmailConfirmationModelType } from '../../modules/user/domain/auth/model-types/email-confirmation.model-type';
import type { PasswordRecoveryCodeDataModelType } from '../../modules/user/domain/auth/model-types/password-recovery-code-data.model-type';
import { PasswordRecoveryCodeData } from '../../modules/user/domain/auth/password-recovery-code-data.entity';
import type { UserModelType } from '../../modules/user/domain/users/model-types/user.model-type';
import { User } from '../../modules/user/domain/users/user.entity';

/*Сервис для тестирования приложения.*/
@Injectable()
export class TestingService {
  constructor(
    @InjectModel(Blog.name) private readonly blogModel: BlogModelType,
    @InjectModel(Post.name) private readonly postModel: PostModelType,
    @InjectModel(PostLikeData.name) private readonly postLikeDataModel: PostLikeDataModelType,
    @InjectModel(Comment.name) private readonly commentModel: CommentModelType,
    @InjectModel(CommentLikeData.name) private readonly commentLikeDataModel: CommentLikeDataModelType,
    @InjectModel(User.name) private readonly userModel: UserModelType,
    @InjectModel(EmailConfirmation.name) private readonly emailConfirmationModel: EmailConfirmationModelType,
    @InjectModel(PasswordRecoveryCodeData.name)
    private readonly passwordRecoveryCodeDataModel: PasswordRecoveryCodeDataModelType,
    @InjectConnection() private readonly connection: Connection
  ) {}

  /*Метод для очистки БД, без удаления индексов.*/
  public async clearDb(): Promise<void> {
    await Promise.all([
      this.blogModel.deleteMany({}),
      this.postModel.deleteMany({}),
      this.postLikeDataModel.deleteMany({}),
      this.commentModel.deleteMany({}),
      this.commentLikeDataModel.deleteMany({}),
      this.userModel.deleteMany({}),
      this.emailConfirmationModel.deleteMany({}),
      this.passwordRecoveryCodeDataModel.deleteMany({}),
    ]);
  }

  /*Метод для полной очистки БД.*/
  public async dropDb(): Promise<void> {
    await this.connection.dropDatabase();
  }
}
