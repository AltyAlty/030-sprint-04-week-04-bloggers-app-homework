import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDataOutputDTO } from '../../../../../core/pagination/output-dto/pagination-meta-data.output-dto';
import { PostOutputDTO } from './post.output-dto';
import { PostListOutputDTO } from './post-list.output-dto';

/*Output DTO для списка постов с пагинацией для Swagger-документации, так как для Swagger нужен именно класс, а не
просто тип.*/
export class PaginatedPostListSwaggerOutputDTO extends PaginationMetaDataOutputDTO<PostListOutputDTO> {
  @ApiProperty({ type: [PostOutputDTO] })
  public items: PostOutputDTO[];
}
