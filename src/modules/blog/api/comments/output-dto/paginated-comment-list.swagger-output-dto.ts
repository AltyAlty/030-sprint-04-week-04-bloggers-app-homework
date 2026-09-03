import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDataOutputDTO } from '../../../../../core/pagination/output-dto/pagination-meta-data.output-dto';
import { CommentOutputDTO } from './comment.output-dto';
import { CommentListOutputDTO } from './comment-list.output-dto';

/*Output DTO для списка комментариев с пагинацией для Swagger-документации, так как для Swagger нужен именно класс, а не
просто тип.*/
export class PaginatedCommentListSwaggerOutputDTO extends PaginationMetaDataOutputDTO<CommentListOutputDTO> {
  @ApiProperty({ type: [CommentOutputDTO] })
  public items: CommentOutputDTO[];
}
