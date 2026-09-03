import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from '../../application/auth/auth.service';
import { UsersService } from '../../application/users/users.service';
import { AuthQueryService } from '../../application/auth/auth.query-service';
import { ErrorsMessagesSwaggerType } from '../../../../core/validation/types/errors-messages.type';
import { AuthUserByLoginOrEmailInputDTO } from './input-dto/query/auth-user-by-login-or-email.input-dto';
import { ConfirmUserByCodeInputDTO } from './input-dto/query/confirm-user-by-code.input-dto';
import { RegisterUserInputDTO } from './input-dto/query/register-user.input-dto';
import { ResendConfirmationEmailInputDTO } from './input-dto/query/resend-confirmation-email.input-dto';
import { SendPasswordRecoveryCodeInputDTO } from './input-dto/query/send-password-recovery-code.input-dto';
import { SetNewPasswordByPasswordRecoveryCodeInputDTO } from './input-dto/query/set-new-password-by-password-recovery-code.input-dto';
import { AuthUserByLoginOrEmailOutputDTO } from './output-dto/auth-user-by-login-or-email.output-dto';
import { GetAuthUserDataByAccessTokenOutputDTO } from './output-dto/get-auth-user-data-by-access-token.output-dto';
import { UserJwtAuthContextDTO } from '../../../../core/guards/jwt-auth/dto/user-jwt-auth-context.dto';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth/jwt-auth.guard';
import { UserLocalAuthContextDTO } from '../../../../core/guards/local-auth/dto/user-local-auth-context.dto';
import { LocalAuthGuard } from '../../../../core/guards/local-auth/local-auth.guard';
import { SETTINGS } from '../../../../core/settings/settings';
import { ExtractUserDataFromRequest } from './decorators/param-extraction/extract-user-data-from-request.param-decorator';

/*Контроллер для работы с аутентификацией и авторизацией.*/
@ApiTags('Auth')
@Controller(SETTINGS.AUTH_PREFIX)
export class AuthController {
  public constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly authQueryService: AuthQueryService
  ) {}

  /*001. POST-запрос по регистрации пользователя.*/
  @ApiOperation({ summary: 'Register a user' })
  @ApiNoContentResponse({
    description:
      'User account has been created. An email with a code to complete the registration has been sent to the user',
  })
  @ApiBadRequestResponse({
    description: 'The input data is invalid or the user already exists',
    type: ErrorsMessagesSwaggerType,
  })
  @Post(SETTINGS.REGISTER_USER_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async registerUser(@Body() body: RegisterUserInputDTO): Promise<void> {
    /*Просим сервис "AuthService" зарегистрировать пользователя.*/
    await this.authService.registerUser(body);
  }

  /*002. POST-запрос по повторной отправке письма для подтверждения регистрации пользователя.*/
  @ApiOperation({ summary: 'Resend a registration confirmation email' })
  @ApiNoContentResponse({
    description: 'An email with a code to complete the registration has been resent to the user',
  })
  @ApiBadRequestResponse({
    description: 'The email is invalid, the user has never registered or the user is already registered',
    type: ErrorsMessagesSwaggerType,
  })
  @Post(SETTINGS.RESEND_CONFIRMATION_EMAIL_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async resendConfirmationEmail(@Body() body: ResendConfirmationEmailInputDTO): Promise<void> {
    /*Просим сервис "AuthService" повторно отправить письмо для подтверждения регистрации пользователя.*/
    await this.authService.resendConfirmationEmail(body);
  }

  /*003. POST-запрос по подтверждению регистрации пользователя по коду подтверждения регистрации пользователя.*/
  @ApiOperation({ summary: 'Confirm a user registration by confirmation code' })
  @ApiNoContentResponse({ description: 'The user registration has been confirmed' })
  @ApiBadRequestResponse({
    description:
      'The confirmation code is invalid or expired, the user has never registered or the user is already registered',
    type: ErrorsMessagesSwaggerType,
  })
  @Post(SETTINGS.CONFIRM_USER_BY_CODE_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async confirmUserByCode(@Body() body: ConfirmUserByCodeInputDTO): Promise<void> {
    /*Просим сервис "UsersService" подтвердить регистрацию пользователя по коду подтверждения регистрации
    пользователя.*/
    await this.usersService.confirmByCode(body);
  }

  /*004. POST-запрос по отправке письма с кодом восстановления пароля пользователя.*/
  @ApiOperation({ summary: 'Send a password recovery code' })
  @ApiNoContentResponse({
    description:
      'An email with a password recovery code has been sent to the user (even if the user is not registered to prevent email detection)',
  })
  @ApiBadRequestResponse({ description: 'The email is invalid', type: ErrorsMessagesSwaggerType })
  @Post(SETTINGS.SEND_PASSWORD_RECOVERY_CODE_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async sendPasswordRecoveryCode(@Body() body: SendPasswordRecoveryCodeInputDTO): Promise<void> {
    /*Просим сервис "AuthService" отправить письмо с кодом восстановления пароля пользователя.*/
    await this.authService.sendPasswordRecoveryCode(body);
  }

  /*005. POST-запрос по установлению нового пароля пользователя по коду восстановления пароля пользователя.*/
  @ApiOperation({ summary: 'Set a new password by password recovery code' })
  @ApiNoContentResponse({ description: `The user's password has been updated` })
  @ApiBadRequestResponse({
    description: 'The password recovery code is invalid or expired, the password is invalid or the user does not exist',
    type: ErrorsMessagesSwaggerType,
  })
  @Post(SETTINGS.SET_NEW_PASSWORD_BY_PASSWORD_RECOVERY_CODE_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async setNewPasswordByPasswordRecoveryCode(
    @Body() body: SetNewPasswordByPasswordRecoveryCodeInputDTO
  ): Promise<void> {
    /*Просим сервис "UsersService" установить новый пароль пользователя по коду восстановления пароля пользователя.*/
    await this.usersService.updatePasswordByPasswordRecoveryCode(body);
  }

  /*006. POST-запрос по аутентификации пользователя по логину или email и паролю.*/
  @ApiOperation({ summary: 'Log in a user by login or email' })
  @ApiOkResponse({
    description: 'Access (through body) and refresh (through cookies) JWT have been sent to the user',
    type: AuthUserByLoginOrEmailOutputDTO,
  })
  @ApiBadRequestResponse({ description: 'The auth credentials are invalid', type: ErrorsMessagesSwaggerType })
  @ApiUnauthorizedResponse({
    description: 'The auth credentials are incorrect',
    type: ErrorsMessagesSwaggerType,
  })
  @Post(SETTINGS.AUTH_USER_BY_LOGIN_OR_EMAIL_PATH)
  @HttpCode(HttpStatus.OK)
  /*Подключаем гард для аутентификации по логину и паролю.*/
  @UseGuards(LocalAuthGuard)
  public async authUserByLoginOrEmail(
    @Body() body: AuthUserByLoginOrEmailInputDTO,
    @ExtractUserDataFromRequest() userLocalAuthContext: UserLocalAuthContextDTO,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthUserByLoginOrEmailOutputDTO> {
    /*Просим сервис "AuthService" создать AT и RT для пользователя.*/
    const { accessToken, refreshToken }: { accessToken: string; refreshToken: string } =
      await this.authService.createUserTokensData(userLocalAuthContext);

    /*Отправляем RT клиенту через cookies, используя метод "res.cookie()" из Express.js.*/
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });
    /*Отправляем AT клиенту через тело ответа.*/
    return { accessToken };
  }

  /*007. GET-запрос по получению данных пользователя по AT.*/
  @ApiOperation({ summary: 'Get authenticated user data by Access JWT' })
  @ApiOkResponse({
    type: GetAuthUserDataByAccessTokenOutputDTO,
    description: 'Authenticated user data has been sent to the user',
  })
  @ApiUnauthorizedResponse({
    description: 'The Access JWT is invalid or the user does not exist',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiBearerAuth()
  @Get(SETTINGS.GET_USER_DATA_BY_ACCESS_TOKEN_PATH)
  @HttpCode(HttpStatus.OK)
  /*Подключаем гард для авторизации по JWT.*/
  @UseGuards(JwtAuthGuard)
  public async getAuthUserDataByAccessToken(
    @ExtractUserDataFromRequest() userJwtAuthContext: UserJwtAuthContextDTO
  ): Promise<GetAuthUserDataByAccessTokenOutputDTO> {
    /*Просим сервис "AuthQueryService" найти данные о пользователе по ID пользователя при предоставлении AT.*/
    return this.authQueryService.getAuthUserDataByUserId(userJwtAuthContext);
  }
}
