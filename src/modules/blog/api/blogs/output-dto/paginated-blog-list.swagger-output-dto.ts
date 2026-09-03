import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDataOutputDTO } from '../../../../../core/pagination/output-dto/pagination-meta-data.output-dto';
import { BlogOutputDTO } from './blog.output-dto';
import { BlogListOutputDTO } from './blog-list.output-dto';

/*Output DTO для списка блогов с пагинацией для Swagger-документации, так как для Swagger нужен именно класс, а не
просто тип.*/
export class PaginatedBlogListSwaggerOutputDTO extends PaginationMetaDataOutputDTO<BlogListOutputDTO> {
  @ApiProperty({ type: [BlogOutputDTO] })
  public items: BlogOutputDTO[];
}
