import { ApiProperty } from '@nestjs/swagger';
import { CommentsQueryRepository } from '../../../infrastructure/comments/comments.query-repository';
import { CommentLikeStatusOutputDTO } from './comment-like-status.output-dto';
import { CommentLikesDataOutputDTO } from './comment-likes-data.output-dto';
import { CommentLikesDataListOutputDTO } from './comment-likes-data-list.output-dto';
import { CommentListOutputDTO } from './comment-list.output-dto';
import { CommentatorInfoOutputDTO } from './commentator-info.output-dto';
import { LikesInfoOutputDTO } from './likes-info.output-dto';
import { CommentDocumentType } from '../../../domain/comments/document-types/comment.document-type';
import { CommentListDocumentType } from '../../../domain/comments/document-types/comment-list.document-type';

/*Output DTO для комментария.*/
export class CommentOutputDTO {
  @ApiProperty({ example: '60d5ec386f6e5a1b3c9d4e2a', description: 'Comment ID' })
  public id: string;

  @ApiProperty({ example: 'commentContent', description: 'Comment content' })
  public content: string;

  @ApiProperty({ description: 'Post commentator data' })
  public commentatorInfo: CommentatorInfoOutputDTO;

  @ApiProperty({ example: '2026-08-28T04:16:49.315Z', description: 'Comment creation date' })
  public createdAt: Date;

  @ApiProperty({ description: 'Comment likes data' })
  public likesInfo: LikesInfoOutputDTO;

  /*Маппер для преобразования комментария из БД в подготовленный для отправки клиенту комментарий.*/
  public static mapFromCommentDocumentTypeToCommentOutputDTO(
    comment: CommentDocumentType,
    likeStatus: CommentLikeStatusOutputDTO
  ): CommentOutputDTO {
    const commentOutputDTO: CommentOutputDTO = new CommentOutputDTO();
    commentOutputDTO.id = comment._id.toString();
    commentOutputDTO.content = comment.content;
    commentOutputDTO.commentatorInfo = comment.commentatorInfo;
    commentOutputDTO.createdAt = comment.createdAt;

    commentOutputDTO.likesInfo = {
      likesCount: comment.likesInfo.likesCount,
      dislikesCount: comment.likesInfo.dislikesCount,
      myStatus: likeStatus,
    };

    return commentOutputDTO;
  }

  /*Маппер для преобразования комментариев из БД в подготовленные для отправки клиенту комментарии.*/
  public static async mapFromCommentListDocumentTypeToCommentListOutputDTO(
    comments: CommentListDocumentType,
    commentsQueryRepository: CommentsQueryRepository,
    userId: string | undefined
  ): Promise<CommentListOutputDTO> {
    /*Если в виде комментариев был передан пустой массив, то возвращаем пустой массив.*/
    if (comments.length === 0) return [];
    /*Получаем ID комментариев.*/
    const commentIds: string[] = comments.map((comment: CommentDocumentType): string => comment._id.toString());
    /*Создаем Map формата "commentId: likeStatus", чтобы избежать многочисленных запросов в БД для получения статусов
    лайков пользователя каждого комментария.*/
    let commentLikesDataMap: Map<string, CommentLikeStatusOutputDTO> = new Map<string, CommentLikeStatusOutputDTO>();

    /*Если был передан ID пользователя, то получаем статусы лайков пользователя каждого комментария.*/
    if (userId) {
      /*Просим query-репозиторий "CommentsQueryRepository" найти данные о лайках комментариев по ID комментариев и ID
      пользователя в БД.*/
      const commentLikesData: CommentLikesDataListOutputDTO =
        await commentsQueryRepository.findAllCommentLikesDataByCommentIdsAndUserId(commentIds, userId);

      /*Заполняем Map статусами лайков пользователя каждого комментария, не обращаясь в БД.*/
      commentLikesDataMap = new Map(
        commentLikesData.map((commentLikeData: CommentLikesDataOutputDTO): [string, CommentLikeStatusOutputDTO] => [
          commentLikeData.commentId,
          commentLikeData.likeStatus as unknown as CommentLikeStatusOutputDTO,
        ])
      );
    }

    /*Формируем массив подготовленных для отправки клиенту комментариев.*/
    return comments.map((comment: CommentDocumentType): CommentOutputDTO => {
      /*Получаем статус лайка комментария.*/
      const likeStatus: CommentLikeStatusOutputDTO =
        commentLikesDataMap.get(comment._id.toString()) ?? CommentLikeStatusOutputDTO.None;

      /*Преобразовываем комментарий из БД в подготовленный для отправки клиенту комментарий.*/
      return this.mapFromCommentDocumentTypeToCommentOutputDTO(comment, likeStatus);
    });
  }
}
