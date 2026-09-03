import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';
import { Argon2Adapter } from '../../../../core/security/cryptography/argon2.adapter';
import { UsersService } from '../users/users.service';
import { AuthRepository } from '../../infrastructure/auth/auth.repository';
import { DomainException, DomainExceptionCode } from '../../../../core/exceptions/domain/domain.exception';
import { UserLocalAuthContextDTO } from '../../../../core/guards/local-auth/dto/user-local-auth-context.dto';
import { EmailManager } from '../../../../core/modules/notification/email-manager/email.manager';
import { SETTINGS } from '../../../../core/settings/settings';
import { EmailConfirmationDocumentType } from '../../domain/auth/document-types/email-confirmation.document-type';
import { PasswordRecoveryCodeDataDocumentType } from '../../domain/auth/document-types/password-recovery-code-data.document-type';
import { EmailConfirmation } from '../../domain/auth/email-confirmation.entity';
import type { EmailConfirmationModelType } from '../../domain/auth/model-types/email-confirmation.model-type';
import type { PasswordRecoveryCodeDataModelType } from '../../domain/auth/model-types/password-recovery-code-data.model-type';
import { PasswordRecoveryCodeData } from '../../domain/auth/password-recovery-code-data.entity';
import { UserDocumentType } from '../../domain/users/document-types/user.document-type';
import { RegisterUserDTO } from './dto/register-user.dto';
import { ResendConfirmationEmailDTO } from './dto/resend-confirmation-email.dto';
import { SendPasswordRecoveryCodeDTO } from './dto/send-password-recovery-code.dto';
import { UserTokensDataDTO } from './dto/user-tokens-data.dto';
import { ValidateJwtPayloadDTO } from './dto/validate-jwt-payload.dto';
import { ValidateUserLocalAuthCredentialsDTO } from './dto/validate-user-local-auth-credentials.dto';

/*Сервис для работы с аутентификацией и авторизацией.*/
@Injectable()
export class AuthService {
  public constructor(
    @InjectModel(EmailConfirmation.name)
    private readonly emailConfirmationModel: EmailConfirmationModelType,
    @InjectModel(PasswordRecoveryCodeData.name)
    private readonly passwordRecoveryCodeDataModel: PasswordRecoveryCodeDataModelType,
    private readonly jwtService: JwtService,
    private readonly argon2Adapter: Argon2Adapter,
    private readonly emailManager: EmailManager,
    private readonly usersService: UsersService,
    private readonly authRepository: AuthRepository
  ) {}

  /*Метод для регистрации пользователя.*/
  public async registerUser(dto: RegisterUserDTO): Promise<void> {
    /*Генерируем код подтверждения регистрации пользователя.*/
    const confirmationCode: string = randomUUID();
    /*Генерируем дату истечения кода подтверждения регистрации пользователя.*/
    const expirationDate: Date = add(new Date(), SETTINGS.CONFIRMATION_REGISTRATION_CODE_EXPIRATION_TIME);
    /*Просим сервис "UsersService" создать пользователя.*/
    const userId: string = await this.usersService.create(dto);

    /*Просим модель "EmailConfirmationModel" создать данные о подтверждении регистрации пользователя.*/
    const emailConfirmation: EmailConfirmationDocumentType = this.emailConfirmationModel.createInstance({
      userId,
      confirmationCode,
      expirationDate,
    });

    /*Просим репозиторий "AuthRepository" сохранить данные о подтверждении регистрации пользователя в БД.*/
    await this.authRepository.saveEmailConfirmation(emailConfirmation);

    /*Просим менеджер "EmailManager" отправить письмо о подтверждении регистрации пользователя. Если использовать здесь
    ключевое слово await, то при ошибке во время отправки письма будет происходить следующее:
    1. Пользователь успешно сохраняется в БД.
    2. Код подтверждения регистрации пользователя успешно сохраняется в БД.
    3. Во время попытки отправить письмо клиенту происходит ошибка.
    4. Клиенту возвращается 500 ответ.
    5. Клиент думает, что регистрация не прошла и пробует зарегистрироваться еще раз.
    6. Клиент повторно вводит тот же email и получает 400 ответ, так как такой email уже занят.
    7. Пользователь оказывается в замешательстве, не понимая, что ему нужно повторно запросить код подтверждения
    регистрации, а не пытаться зарегистрироваться заново.

    Если нужно использовать здесь ключевое слово await, то операцию нужно делать в виде транзакции.*/
    this.emailManager
      .sendCompleteRegistrationEmail(dto.email, confirmationCode)
      .catch((error: any): void => console.error('Failed to send a complete registration email: ', error));
  }

  /*Метод для повторной отправки письма для подтверждения регистрации пользователя.*/
  public async resendConfirmationEmail(dto: ResendConfirmationEmailDTO): Promise<void> {
    /*Просим сервис "UsersService" найти пользователя по email без выброса исключений.*/
    const user: UserDocumentType | null = await this.usersService.findByEmailWithoutExceptions(dto.email);

    /*Если пользователь не был найден, то выбрасываем исключение с информацией об этом.*/
    if (!user)
      throw new DomainException({
        code: DomainExceptionCode.UserNotFoundWhileResendingConfirmationEmail,
        message: 'User to confirm not found',
        field: 'email',
      });

    /*Если регистрация пользователя уже была подтверждена, то выбрасываем исключение с информацией об этом.*/
    if (user.isConfirmed)
      throw new DomainException({
        code: DomainExceptionCode.AlreadyConfirmedUserRegistration,
        message: 'Registration has already been confirmed',
        field: 'email',
      });

    /*Если регистрация пользователя еще не была подтверждена, то генерируем код подтверждения регистрации
    пользователя.*/
    const confirmationCode: string = randomUUID();
    /*Генерируем дату истечения кода подтверждения регистрации пользователя.*/
    const expirationDate: Date = add(new Date(), SETTINGS.CONFIRMATION_REGISTRATION_CODE_EXPIRATION_TIME);
    /*Получаем ID пользователя.*/
    const userId: string = user.id;

    /*Просим репозиторий "AuthRepository" найти данные о подтверждении регистрации пользователя по ID пользователя в
    БД.*/
    let emailConfirmation: EmailConfirmationDocumentType | null =
      await this.authRepository.findEmailConfirmationByUserId(userId);

    /*Если данные о подтверждении регистрации пользователя были найдены, то изменяем их.*/
    if (emailConfirmation) {
      emailConfirmation.updateInstance({ confirmationCode, expirationDate });
    } else {
      /*Если данные о подтверждении регистрации пользователя не были найдены, то просим модель "EmailConfirmationModel"
      создать такие данные.*/
      emailConfirmation = this.emailConfirmationModel.createInstance({ userId, confirmationCode, expirationDate });
    }

    /*Просим репозиторий "AuthRepository" сохранить данные о подтверждении регистрации пользователя в БД.*/
    await this.authRepository.saveEmailConfirmation(emailConfirmation);

    /*Просим менеджер "EmailManager" повторно отправить письмо о подтверждении регистрации пользователя.*/
    this.emailManager
      .sendCompleteRegistrationEmail(dto.email, confirmationCode)
      .catch((error: any): void => console.error('Failed to resend a complete registration email: ', error));
  }

  /*Метод для отправки письма с кодом восстановления пароля пользователя.*/
  public async sendPasswordRecoveryCode(dto: SendPasswordRecoveryCodeDTO): Promise<void> {
    /*Просим сервис "UsersService" найти пользователя по email без выброса исключений.*/
    const user: UserDocumentType | null = await this.usersService.findByEmailWithoutExceptions(dto.email);
    /*Если пользователь не был найден, то завершаем работу метода, чтобы не возвращать ошибку клиенту.*/
    if (!user) return;
    /*Если пользователь был найден, то получаем ID пользователя.*/
    const userId: string = user.id;
    /*Генерируем код восстановления пароля пользователя.*/
    const passwordRecoveryCode: string = randomUUID();
    /*Генерируем дату истечения кода восстановления пароля пользователя.*/
    const expirationDate: Date = add(new Date(), SETTINGS.PASSWORD_RECOVERY_CODE_EXPIRATION_TIME);

    /*Просим репозиторий "AuthRepository" найти данные о коде восстановления пароля пользователя по ID пользователя в
    БД.*/
    let passwordRecoveryCodeData: PasswordRecoveryCodeDataDocumentType | null =
      await this.authRepository.findRecoveryPasswordCodeDataByUserId(userId);

    /*Если данные о коде восстановления пароля пользователя были найдены, то изменяем их.*/
    if (passwordRecoveryCodeData) {
      passwordRecoveryCodeData.updateInstance({ passwordRecoveryCode, expirationDate });
    } else {
      /*Если данные о коде восстановления пароля пользователя не были найдены, то просим модель
      "PasswordRecoveryCodeDataModel" создать такие данные.*/
      passwordRecoveryCodeData = this.passwordRecoveryCodeDataModel.createInstance({
        userId,
        passwordRecoveryCode,
        expirationDate,
      });
    }

    /*Просим репозиторий "AuthRepository" сохранить данные о коде восстановления пароля пользователя в БД.*/
    await this.authRepository.savePasswordRecoveryCodeData(passwordRecoveryCodeData);

    /*Просим менеджер "EmailManager" отправить письмо с кодом восстановления пароля пользователя.*/
    this.emailManager
      .sendPasswordRecoveryEmail(dto.email, passwordRecoveryCode)
      .catch((error: any): void => console.error('Failed to send a recovery password email: ', error));
  }

  /*Метод для валидации учетных данных пользователя при аутентификации по логину или email и паролю.*/
  public async validateUserLocalAuthCredentials(
    dto: ValidateUserLocalAuthCredentialsDTO
  ): Promise<UserLocalAuthContextDTO | null> {
    /*Просим сервис "UsersService" найти пользователя по логину или email без выброса исключений.*/
    const user: UserDocumentType | null = await this.usersService.findByLoginOrEmailWithoutExceptions(dto.loginOrEmail);
    /*Если пользователь не был найден, то возвращаем null.*/
    if (!user) return null;
    /*Если пользователь был найден, то просим адаптер "Argon2Adapter" валидировать пароль.*/
    const isPasswordValid = await this.argon2Adapter.checkPasswordByHash(dto.password, user.passwordHash);
    /*Если пароль оказался невалидным, то возвращаем null.*/
    if (!isPasswordValid) return null;
    /*Если пароль оказался валидным, то возвращаем ID пользователя.*/
    return { id: user.id.toString() };
  }

  /*Метод для создания токенов для пользователя.*/
  public async createUserTokensData(userLocalAuthContext: UserLocalAuthContextDTO): Promise<UserTokensDataDTO> {
    /*Просим сервис "JwtService" создать AT.*/
    const accessToken: string = await this.jwtService.signAsync(
      { userId: userLocalAuthContext.id },
      { secret: SETTINGS.AT_SECRET, expiresIn: SETTINGS.AT_TIME as JwtSignOptions['expiresIn'] }
    );

    /*Просим сервис "JwtService" создать RT.*/
    const refreshToken: string = await this.jwtService.signAsync(
      { userId: userLocalAuthContext.id },
      { secret: SETTINGS.RT_SECRET, expiresIn: SETTINGS.RT_TIME as JwtSignOptions['expiresIn'] }
    );

    /*Возвращаем AT.*/
    return { accessToken, refreshToken };
  }

  /*Метод для валидации payload из JWT.*/
  public async validateJwtPayload(dto: ValidateJwtPayloadDTO): Promise<UserDocumentType | null> {
    /*Просим сервис "UsersService" найти пользователя по ID без выброса исключений.*/
    return await this.usersService.findByIdWithoutExceptions(dto.userId);
  }
}
