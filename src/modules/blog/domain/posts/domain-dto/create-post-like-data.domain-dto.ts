import { PostLikeStatusDomainDTO } from './post-like-status.domain-dto';

/*Domain DTO для создания данных о лайке поста.*/
export class CreatePostLikeDataDomainDTO {
  public postId: string;
  public userId: string;
  public login: string;
  public likeStatus: PostLikeStatusDomainDTO;
}
