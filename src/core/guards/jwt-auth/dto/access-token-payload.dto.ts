/*DTO для декодированного payload из AT.*/
export class AccessTokenPayloadDTO {
  userId: string;
  iat: number;
  exp: number;
}
