/*Коды исключений для доменного слоя.*/
export enum DomainExceptionCode {
  /*Auth.*/
  TooManyRequests = 101,
  NoBasicAuthHeader = 102,
  InvalidBasicAuthType = 103,
  InvalidBasicAuthCredentials = 104,
  InvalidLocalAuthCredentials = 105,
  InvalidAccessJwtPayload = 106,
  InvalidAccessJwt = 107,
  InvalidRefreshJwtPayload = 108,
  InvalidRefreshJwt = 109,
  InvalidUserRegistrationConfirmationCode = 110,
  ExpiredUserRegistrationConfirmationCode = 111,
  InvalidPasswordRecoveryCode = 112,
  ExpiredPasswordRecoveryCode = 113,
  NoUserDataToExtractInRequest = 114,
  SessionAlreadyMarkedAsDeleted = 115,
  /*Security devices.*/
  SecurityDeviceNotfoundWhileRevokingSessionBySecurityDeviceId = 201,
  SecurityDeviceAlreadyMarkedAsDeleted = 202,
  /*Users.*/
  NotUniqueLoginToCreateUser = 301,
  NotUniqueEmailToCreateUser = 302,
  UserNotFoundWhileResendingConfirmationEmail = 303,
  UserNotFoundWhileRegistrationConfirmation = 304,
  UserNotFoundWhilePasswordRecovery = 305,
  UserNotFoundWhileGettingAuthData = 306,
  AlreadyConfirmedUserRegistration = 307,
  WrongSecurityDeviceOwnerWhileRevokingSessionBySecurityDeviceId = 308,
  UserNotFoundWhileDeleting = 309,
  UserAlreadyMarkedAsDeleted = 310,
  /*Blogs.*/
  BlogNotFoundWhilePostCreating = 401,
  BlogNotFound = 402,
  BlogNotFoundWhilePostSearching = 403,
  BlogNotFoundWhileUpdating = 404,
  BlogNotFoundWhileDeleting = 405,
  BlogAlreadyMarkedAsDeleted = 406,
  /*Posts.*/
  PostNotFoundWhileCommentCreating = 501,
  PostNotFound = 502,
  PostNotFoundWhileCommentSearching = 503,
  PostNotFoundWhileUpdating = 504,
  PostNotFoundWhileUpdatingLikeStatus = 505,
  PostNotFoundWhileDeleting = 506,
  PostAlreadyMarkedAsDeleted = 507,
  /*Comments.*/
  CommentNotFound = 601,
  CommentNotFoundWhileUpdating = 602,
  CommentNotFoundWhileUpdatingLikeStatus = 603,
  WrongCommentOwnerWhileUpdating = 604,
  CommentNotFoundWhileDeleting = 605,
  WrongCommentOwnerWhileDeleting = 606,
  CommentAlreadyMarkedAsDeleted = 607,
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
