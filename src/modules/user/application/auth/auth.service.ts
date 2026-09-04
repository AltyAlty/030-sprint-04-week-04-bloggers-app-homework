import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';
import { Types } from 'mongoose';
import { Argon2Adapter } from '../../../../core/security/cryptography/argon2.adapter';
import { SecurityDevicesService } from '../security-devices/security-devices.service';
import { UsersService } from '../users/users.service';
import { AuthRepository } from '../../infrastructure/auth/auth.repository';
import { DomainException, DomainExceptionCode } from '../../../../core/exceptions/domain/domain.exception';
import { UserLocalAuthContextDTO } from '../../../../core/guards/local-auth/dto/user-local-auth-context.dto';
import { UserRefreshJwtAuthContextDTO } from '../../../../core/guards/refresh-jwt-auth/dto/user-refresh-jwt-auth-context.dto';
import { EmailManager } from '../../../../core/modules/notification/email-manager/email.manager';
import { UserAgentAndIpDTO } from '../../api/auth/decorators/param-extraction/dto/user-agent-and-ip.dto';
import { AuthConfig } from '../../config/auth.config';
import { EmailConfirmationDocumentType } from '../../domain/auth/document-types/email-confirmation.document-type';
import { PasswordRecoveryCodeDataDocumentType } from '../../domain/auth/document-types/password-recovery-code-data.document-type';
import { SessionDocumentType } from '../../domain/auth/document-types/session.document-type';
import { EmailConfirmation } from '../../domain/auth/email-confirmation.entity';
import type { EmailConfirmationModelType } from '../../domain/auth/model-types/email-confirmation.model-type';
import type { PasswordRecoveryCodeDataModelType } from '../../domain/auth/model-types/password-recovery-code-data.model-type';
import type { SessionModelType } from '../../domain/auth/model-types/session.model-type';
import { PasswordRecoveryCodeData } from '../../domain/auth/password-recovery-code-data.entity';
import { Session } from '../../domain/auth/session.entity';
import { SecurityDeviceDocumentType } from '../../domain/security-devices/document-types/security-device.document-type';
import { UserDocumentType } from '../../domain/users/document-types/user.document-type';
import { RegisterUserDTO } from './dto/register-user.dto';
import { ResendConfirmationEmailDTO } from './dto/resend-confirmation-email.dto';
import { SendPasswordRecoveryCodeDTO } from './dto/send-password-recovery-code.dto';
import { UserTokensDataDTO } from './dto/user-tokens-data.dto';
import { ValidateAccessJwtPayloadDTO } from './dto/validate-access-jwt-payload.dto';
import { ValidateRefreshJwtPayloadDTO } from './dto/validate-refresh-jwt-payload.dto';
import { ValidateUserLocalAuthCredentialsDTO } from './dto/validate-user-local-auth-credentials.dto';

/*Сервис для работы с аутентификацией и авторизацией.*/
@Injectable()
export class AuthService {
  public constructor(
    @InjectModel(EmailConfirmation.name)
    private readonly emailConfirmationModel: EmailConfirmationModelType,
    @InjectModel(PasswordRecoveryCodeData.name)
    private readonly passwordRecoveryCodeDataModel: PasswordRecoveryCodeDataModelType,
    @InjectModel(Session.name) private readonly sessionModel: SessionModelType,
    private readonly authConfig: AuthConfig,
    private readonly jwtService: JwtService,
    private readonly argon2Adapter: Argon2Adapter,
    private readonly emailManager: EmailManager,
    private readonly securityDevicesService: SecurityDevicesService,
    private readonly usersService: UsersService,
    private readonly authRepository: AuthRepository
  ) {}

  /*Метод для регистрации пользователя.*/
  public async registerUser(dto: RegisterUserDTO): Promise<void> {
    /*Генерируем код подтверждения регистрации пользователя.*/
    const confirmationCode: string = randomUUID();

    /*Генерируем дату истечения кода подтверждения регистрации пользователя.*/
    const expirationDate: Date = add(new Date(), {
      minutes: this.authConfig.CONFIRMATION_REGISTRATION_CODE_EXPIRATION_TIME_IN_MINUTES,
    });

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
    const expirationDate: Date = add(new Date(), {
      minutes: this.authConfig.CONFIRMATION_REGISTRATION_CODE_EXPIRATION_TIME_IN_MINUTES,
    });

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
    const expirationDate: Date = add(new Date(), {
      minutes: this.authConfig.PASSWORD_RECOVERY_CODE_EXPIRATION_TIME_IN_MINUTES,
    });

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

  /*Метод для аутентификации пользователя.*/
  public async authUser(
    userLocalAuthContext: UserLocalAuthContextDTO,
    ipAndUserAgent: UserAgentAndIpDTO
  ): Promise<UserTokensDataDTO> {
    /*Получаем ID пользователя.*/
    const userId: string = userLocalAuthContext.id;
    /*Генерируем ID пользовательского устройства.*/
    const deviceId: string = new Types.ObjectId().toString();
    /*Получаем значение заголовка "user-agent".*/
    const userAgent: string = ipAndUserAgent.userAgent;
    /*Получаем IP-адрес пользователя.*/
    const ip: string = ipAndUserAgent.ip;

    /*Просим сервис "JwtService" создать AT.*/
    const accessToken: string = await this.jwtService.signAsync(
      { userId },
      {
        secret: this.authConfig.AT_SECRET,
        expiresIn: this.authConfig.AT_TIME_IN_SECONDS as JwtSignOptions['expiresIn'],
      }
    );

    /*Просим сервис "JwtService" создать RT.*/
    const refreshToken: string = await this.jwtService.signAsync(
      { userId, deviceId },
      {
        secret: this.authConfig.RT_SECRET,
        expiresIn: this.authConfig.RT_TIME_IN_SECONDS as JwtSignOptions['expiresIn'],
      }
    );

    /*Получаем payload из RT.*/
    const { iat: refreshTokenIat, exp: refreshTokenExp }: { iat: number; exp: number } =
      await this.jwtService.decode(refreshToken);

    /*Формируем даты создания и истечения RT.*/
    const refreshTokenIatDate: Date = new Date(refreshTokenIat * 1000);
    const refreshTokenExpDate: Date = new Date(refreshTokenExp * 1000);

    /*Просим модель "SessionModel" создать пользовательскую сессию.*/
    const session: SessionDocumentType = this.sessionModel.createInstance({
      userId,
      deviceId,
      deviceName: userAgent,
      ip,
      iat: refreshTokenIatDate,
      exp: refreshTokenExpDate,
    });

    /*Просим репозиторий "AuthRepository" сохранить пользовательскую сессию в БД.*/
    await this.authRepository.saveSession(session);

    /*Просим сервис "SecurityDevicesService" создать пользовательское устройство.*/
    await this.securityDevicesService.create({
      deviceId,
      userId,
      title: userAgent,
      ip,
      lastActiveDate: refreshTokenIatDate,
    });

    /*Возвращаем AT.*/
    return { accessToken, refreshToken };
  }

  /*Метод для создания новой пары AT и RT.*/
  public async getNewAccessAndRefreshTokens(
    userRefreshJwtAuthContext: UserRefreshJwtAuthContextDTO,
    ipAndUserAgent: UserAgentAndIpDTO
  ): Promise<UserTokensDataDTO> {
    /*Получаем ID пользователя.*/
    const userId: string = userRefreshJwtAuthContext.id;
    /*Получаем ID пользовательского устройства.*/
    const deviceId: string = userRefreshJwtAuthContext.deviceId;
    /*Получаем значение заголовка "user-agent".*/
    const userAgent: string = ipAndUserAgent.userAgent;
    /*Получаем IP-адрес пользователя.*/
    const ip: string = ipAndUserAgent.ip;

    /*Просим сервис "JwtService" создать AT.*/
    const accessToken: string = await this.jwtService.signAsync(
      { userId },
      {
        secret: this.authConfig.AT_SECRET,
        expiresIn: this.authConfig.AT_TIME_IN_SECONDS as JwtSignOptions['expiresIn'],
      }
    );

    /*Просим сервис "JwtService" создать RT.*/
    const refreshToken: string = await this.jwtService.signAsync(
      { userId, deviceId },
      {
        secret: this.authConfig.RT_SECRET,
        expiresIn: this.authConfig.RT_TIME_IN_SECONDS as JwtSignOptions['expiresIn'],
      }
    );

    /*Получаем payload из RT.*/
    const { iat: refreshTokenIat, exp: refreshTokenExp }: { iat: number; exp: number } =
      await this.jwtService.decode(refreshToken);

    /*Формируем даты создания и истечения RT.*/
    const refreshTokenIatDate: Date = new Date(refreshTokenIat * 1000);
    const refreshTokenExpDate: Date = new Date(refreshTokenExp * 1000);

    /*Просим репозиторий "AuthRepository" найти пользовательскую сессию по ID пользователя, ID пользовательского
    устройства и дате выдачи RT в БД.*/
    const session: SessionDocumentType | null = await this.authRepository.findSessionByUserIdAndDeviceIdAndIat(
      userId,
      deviceId,
      userRefreshJwtAuthContext.iat
    );

    /*Изменяем пользовательскую сессию.*/
    session!.update({ deviceName: userAgent, ip, iat: refreshTokenIatDate, exp: refreshTokenExpDate });
    /*Просим репозиторий "AuthRepository" сохранить измененную пользовательскую сессию в БД.*/
    await this.authRepository.saveSession(session!);

    /*Просим сервис "SecurityDevicesService" изменить пользовательское устройство по ID.*/
    await this.securityDevicesService.updateById(deviceId, {
      title: userAgent,
      ip,
      lastActiveDate: refreshTokenIatDate,
    });

    /*Возвращаем AT.*/
    return { accessToken, refreshToken };
  }

  /*Метод для отзыва пользовательской сессии.*/
  public async revokeSession(userRefreshJwtAuthContext: UserRefreshJwtAuthContextDTO): Promise<void> {
    /*Получаем ID пользовательского устройства.*/
    const deviceId: string = userRefreshJwtAuthContext.deviceId;
    /*Просим репозиторий "AuthRepository" удалить пользовательскую сессию по ID пользователя, ID пользовательского
    устройства и дате выдачи RT в БД.*/
    await this.authRepository.deleteSessionByUserIdAndDeviceIdAndIat(
      userRefreshJwtAuthContext.id,
      deviceId,
      userRefreshJwtAuthContext.iat
    );
    /*Просим сервис "SecurityDevicesService" удалить пользовательское устройство по ID без выброса исключений.*/
    await this.securityDevicesService.deleteByIdWithoutExceptions(deviceId);
  }

  /*Метод для отзыва пользовательской сессии по ID пользовательского устройства.*/
  public async revokeSessionBySecurityDeviceId(
    deviceId: string,
    userRefreshJwtAuthContext: UserRefreshJwtAuthContextDTO
  ): Promise<void> {
    /*Получаем ID пользователя.*/
    const userId: string = userRefreshJwtAuthContext.id;

    /*Просим сервис "SecurityDevicesService" найти пользовательское устройство по ID без выброса исключений.*/
    const securityDevice: SecurityDeviceDocumentType | null =
      await this.securityDevicesService.findByIdWithoutExceptions(deviceId);

    /*Если пользовательское устройство не было найдено, то выбрасываем исключение с информацией об этом.*/
    if (!securityDevice)
      throw new DomainException({
        code: DomainExceptionCode.SecurityDeviceNotfoundWhileRevokingSessionBySecurityDeviceId,
        message: 'Security device to revoke a session not found',
        field: 'id',
      });

    /*Если пользователь не является владельцем пользовательского устройства, то выбрасываем исключение с информацией об
    этом.*/
    if (securityDevice.userId !== userId)
      throw new DomainException({
        code: DomainExceptionCode.WrongSecurityDeviceOwnerWhileRevokingSessionBySecurityDeviceId,
        message: 'The user is not the owner of the security device to revoke a session',
        field: 'id',
      });

    /*Если пользователь является владельцем пользовательского устройства, то просим репозиторий "AuthRepository" удалить
    пользовательскую сессию по ID пользователя, ID пользовательского устройства и дате выдачи RT в БД.*/
    await this.authRepository.deleteSessionByUserIdAndDeviceIdAndIat(userId, deviceId, userRefreshJwtAuthContext.iat);
    /*Просим сервис "SecurityDevicesService" удалить пользовательское устройство по ID без выброса исключений.*/
    await this.securityDevicesService.deleteByIdWithoutExceptions(deviceId);
  }

  /*Метод для отзыва всех пользовательских сессий, кроме текущей.*/
  public async revokeAllSessionsExceptCurrentOne(
    userRefreshJwtAuthContext: UserRefreshJwtAuthContextDTO
  ): Promise<void> {
    /*Получаем ID пользователя.*/
    const userId: string = userRefreshJwtAuthContext.id;
    /*Получаем ID пользовательского устройства.*/
    const deviceId: string = userRefreshJwtAuthContext.deviceId;
    /*Просим репозиторий "AuthRepository" удалить все пользовательские сессии по ID пользователя и ID пользовательского
    устройства в БД.*/
    await this.authRepository.deleteAllSessionsExceptCurrentOneByUserIdAndSecurityDeviceId(userId, deviceId);
    /*Просим сервис "SecurityDevicesService" удалить все пользовательские устройства, кроме текущего, по ID
    пользовательского устройства и ID пользователя.*/
    await this.securityDevicesService.deleteAllExceptCurrentOneBySecurityDeviceIdAndUserId(deviceId, userId);
  }

  /*Метод для валидации учетных данных пользователя при аутентификации по логину или email и паролю.*/
  public async validateUserLocalAuthCredentials(
    dto: ValidateUserLocalAuthCredentialsDTO
  ): Promise<UserLocalAuthContextDTO | null> {
    /*Просим сервис "UsersService" найти пользователя по логину или email без выброса исключений.*/
    const user: UserDocumentType | null = await this.usersService.findByLoginOrEmailWithoutExceptions(dto.loginOrEmail);
    /*Если пользователь не был найден, то возвращаем null.*/
    if (!user) return null;
    /*Если у пользователя не была подтверждена регистрация, то возвращаем null.*/
    if (!user.isConfirmed) return null;
    /*Если пользователь был найден и его регистрация подтверждена, то просим адаптер "Argon2Adapter" валидировать
    пароль.*/
    const isPasswordValid: boolean = await this.argon2Adapter.checkPasswordByHash(dto.password, user.passwordHash);
    /*Если пароль оказался невалидным, то возвращаем null.*/
    if (!isPasswordValid) return null;
    /*Если пароль оказался валидным, то возвращаем ID пользователя.*/
    return { id: user.id.toString() };
  }

  /*Метод для валидации payload из Access JWT.*/
  public async validateAccessJwtPayload(dto: ValidateAccessJwtPayloadDTO): Promise<UserDocumentType | null> {
    /*Просим сервис "UsersService" найти пользователя по ID без выброса исключений.*/
    return await this.usersService.findByIdWithoutExceptions(dto.userId);
  }

  /*Метод для валидации payload из Refresh JWT.*/
  public async validateRefreshJwtPayload(dto: ValidateRefreshJwtPayloadDTO): Promise<UserDocumentType | null> {
    /*Просим репозиторий "AuthRepository" найти пользовательскую сессию по ID пользователя, ID пользовательского
    устройства и дате выдачи RT в БД.*/
    const session: SessionDocumentType | null = await this.authRepository.findSessionByUserIdAndDeviceIdAndIat(
      dto.userId,
      dto.deviceId,
      new Date(dto.iat * 1000)
    );

    /*Если пользовательская сессия не была найдена, то возвращаем null.*/
    if (!session) return null;

    /*Если пользовательская сессия была найдена, то просим сервис "SecurityDevicesService" найти пользовательское
    устройство по ID без выброса исключений.*/
    const securityDevice: SecurityDeviceDocumentType | null =
      await this.securityDevicesService.findByIdWithoutExceptions(dto.deviceId);

    /*Если пользовательское устройство не было найдено, то возвращаем null.*/
    if (!securityDevice) return null;

    /*Если пользовательская сессия и пользовательское устройство были найдены, то просим сервис "UsersService" найти
    пользователя по ID без выброса исключений.*/
    return await this.usersService.findByIdWithoutExceptions(dto.userId);
  }
}
