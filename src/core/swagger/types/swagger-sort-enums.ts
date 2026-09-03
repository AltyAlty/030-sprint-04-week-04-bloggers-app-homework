import { ApiProperty } from '@nestjs/swagger';
import { BlogSortFieldQueryInputDTO } from '../../../modules/blog/api/blogs/input-dto/query/blog-sort-field-query.input-dto';
import { CommentSortFieldQueryInputDTO } from '../../../modules/blog/api/comments/input-dto/query/comment-sort-field-query.input-dto';
import { PostSortFieldQueryInputDTO } from '../../../modules/blog/api/posts/input-dto/query/post-sort-field-query.input-dto';
import { UserSortFieldQueryInputDTO } from '../../../modules/user/api/users/input-dto/query/user-sort-field-query.input-dto';
import { SortDirectionInputDTO } from '../../pagination/input-dto/sort-direction.input-dto';

/*При использовании декоратора "@ApiPropertyOptional()" из модуля @nestjs/swagger пришлось убрать настройку "enumName",
из-за которой не выводился раздел "Default value" в Swagger-документации. Но из-за этого внизу Swagger-документации
пропали Input DTO, касательно полей сортироровки. Чтобы их вернуть создаем этот класс и используем его при настройке
Swagger-документации.*/
export class SwaggerSortEnums {
  @ApiProperty({ enum: SortDirectionInputDTO, enumName: 'SortDirectionInputDTO' })
  public SortDirectionInputDTO: SortDirectionInputDTO;

  @ApiProperty({ enum: UserSortFieldQueryInputDTO, enumName: 'UserSortFieldQueryInputDTO' })
  public UserSortFieldQueryInputDTO: UserSortFieldQueryInputDTO;

  @ApiProperty({ enum: BlogSortFieldQueryInputDTO, enumName: 'BlogSortFieldQueryInputDTO' })
  public BlogSortFieldQueryInputDTO: BlogSortFieldQueryInputDTO;

  @ApiProperty({ enum: PostSortFieldQueryInputDTO, enumName: 'PostSortFieldQueryInputDTO' })
  public PostSortFieldQueryInputDTO: PostSortFieldQueryInputDTO;

  @ApiProperty({ enum: CommentSortFieldQueryInputDTO, enumName: 'CommentSortFieldQueryInputDTO' })
  public CommentSortFieldQueryInputDTO: CommentSortFieldQueryInputDTO;
}
