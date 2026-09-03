/*DTO для валидации payload из JWT.*/
export class ValidateJwtPayloadDTO {
  userId: string;
  iat: number;
  exp: number;
}
