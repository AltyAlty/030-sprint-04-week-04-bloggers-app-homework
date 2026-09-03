import { CommentatorInfo } from '../schemas/commentator-info.schema';

/*Domain DTO для создания комментария.*/
export class CreateCommentDomainDTO {
  public content: string;
  public postId: string;
  public commentatorInfo: CommentatorInfo;
}
