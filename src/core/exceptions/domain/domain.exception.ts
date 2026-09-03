/*Коды исключений для доменного слоя.*/
export enum DomainExceptionCode {
  /*Auth.*/
  NoBasicAuthHeader = 101,
  InvalidBasicAuthType = 102,
  InvalidBasicAuthCredentials = 103,
  InvalidLocalAuthCredentials = 104,
  InvalidAccessJwtPayload = 105,
  InvalidAccessJwt = 106,
  InvalidUserRegistrationConfirmationCode = 107,
  ExpiredUserRegistrationConfirmationCode = 108,
  InvalidPasswordRecoveryCode = 109,
  ExpiredPasswordRecoveryCode = 110,
  NoUserDataToExtractInRequest = 111,
  /*Users.*/
  NotUniqueLoginToCreateUser = 201,
  NotUniqueEmailToCreateUser = 202,
  UserNotFoundWhileResendingConfirmationEmail = 203,
  UserNotFoundWhileRegistrationConfirmation = 204,
  UserNotFoundWhilePasswordRecovery = 205,
  UserNotFoundWhileGettingAuthData = 206,
  AlreadyConfirmedUserRegistration = 207,
  UserNotFoundWhileDeleting = 208,
  UserAlreadyMarkedAsDeleted = 209,
  /*Blogs.*/
  BlogNotFoundWhilePostCreating = 301,
  BlogNotFound = 302,
  BlogNotFoundWhilePostSearching = 303,
  BlogNotFoundWhileUpdating = 304,
  BlogNotFoundWhileDeleting = 305,
  BlogAlreadyMarkedAsDeleted = 306,
  /*Posts.*/
  PostNotFoundWhileCommentCreating = 401,
  PostNotFound = 402,
  PostNotFoundWhileCommentSearching = 403,
  PostNotFoundWhileUpdating = 404,
  PostNotFoundWhileUpdatingLikeStatus = 405,
  PostNotFoundWhileDeleting = 406,
  PostAlreadyMarkedAsDeleted = 407,
  /*Comments.*/
  CommentNotFound = 501,
  CommentNotFoundWhileUpdating = 502,
  CommentNotFoundWhileUpdatingLikeStatus = 503,
  WrongCommentOwnerWhileUpdating = 504,
  CommentNotFoundWhileDeleting = 505,
  WrongCommentOwnerWhileDeleting = 506,
  CommentAlreadyMarkedAsDeleted = 507,
}

/*Кастомный класс исключений для доменного слоя.*/
export class DomainException extends Error {
  public readonly code: DomainExceptionCode;
  public readonly message: string;
  public readonly field?: string | undefined;

  public constructor(errorInfo: { code: DomainExceptionCode; message: string; field?: string }) {
    /*Встроенный родительский класс "Error" может принимать текст сообщения об ошибке.*/
    super(errorInfo.message);
    this.name = DomainException.name;
    this.code = errorInfo.code;
    this.message = errorInfo.message;
    this.field = errorInfo.field || '';
  }
}
