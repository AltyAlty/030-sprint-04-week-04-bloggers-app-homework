import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Argon2Adapter } from '../../../../core/security/cryptography/argon2.adapter';
import { AuthRepository } from '../../infrastructure/auth/auth.repository';
import { UsersRepository } from '../../infrastructure/users/users.repository';
import { UserOutputDTO } from '../../api/users/output-dto/user.output-dto';
import { DomainException, DomainExceptionCode } from '../../../../core/exceptions/domain/domain.exception';
import { EmailConfirmationDocumentType } from '../../domain/auth/document-types/email-confirmation.document-type';
import { PasswordRecoveryCodeDataDocumentType } from '../../domain/auth/document-types/password-recovery-code-data.document-type';
import { UserDocumentType } from '../../domain/users/document-types/user.document-type';
import type { UserModelType } from '../../domain/users/model-types/user.model-type';
import { User } from '../../domain/users/user.entity';
import { ConfirmUserByCodeDTO } from './dto/confirm-user-by-code.dto';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdatePasswordByPasswordRecoveryCodeDTO } from './dto/update-password-by-password-recovery-code.dto';

/*Сервис для пользователей.*/
@Injectable()
export class UsersService {
  public constructor(
    @InjectModel(User.name)
    private readonly userModel: UserModelType,
    private readonly argon2Adapter: Argon2Adapter,
    private readonly authRepository: AuthRepository,
    private readonly usersRepository: UsersRepository
  ) {}

  /*Метод для создания пользователя.*/
  public async create(dto: CreateUserDTO): Promise<string> {
    /*Просим сервис "UsersService" найти пользователя по логину без выброса исключений.*/
    let user: UserDocumentType | null = await this.findByLoginWithoutExceptions(dto.login);

    /*Если пользователь был найден, то выбрасываем исключение с информацией об этом.*/
    if (user)
      throw new DomainException({
        code: DomainExceptionCode.NotUniqueLoginToCreateUser,
        message: 'Login must be unique',
        field: 'login',
      });

    /*Просим сервис "UsersService" найти пользователя по email без выброса исключений.*/
    user = await this.findByEmailWithoutExceptions(dto.email);

    /*Если пользователь был найден, то выбрасываем исключение с информацией об этом.*/
    if (user)
      throw new DomainException({
        code: DomainExceptionCode.NotUniqueEmailToCreateUser,
        message: 'Email must be unique',
        field: 'email',
      });

    /*Если пользователь еще не был создан, то просим адаптер "Argon2Adapter" сгенерировать хеш для пароля.*/
    const passwordHash: string = await this.argon2Adapter.generatePasswordHash(dto.password);
    /*Просим модель "UserModel" создать пользователя.*/
    user = this.userModel.createInstance({ login: dto.login, email: dto.email, passwordHash });
    /*Просим репозиторий "UsersRepository" сохранить пользователя в БД.*/
    await this.usersRepository.save(user);
    /*Возвращаем ID созданного пользователя.*/
    return user.id;
  }

  /*Метод для создания подтвержденного пользователя.*/
  public async createConfirmedUser(dto: CreateUserDTO): Promise<UserOutputDTO> {
    /*Просим сервис "UsersService" найти пользователя по логину без выброса исключений.*/
    let user: UserDocumentType | null = await this.findByLoginWithoutExceptions(dto.login);

    /*Если пользователь был найден, то выбрасываем исключение с информацией об этом.*/
    if (user)
      throw new DomainException({
        code: DomainExceptionCode.NotUniqueLoginToCreateUser,
        message: 'Login must be unique',
        field: 'login',
      });

    /*Просим сервис "UsersService" найти пользователя по email без выброса исключений.*/
    user = await this.findByEmailWithoutExceptions(dto.email);

    /*Если пользователь был найден, то выбрасываем исключение с информацией об этом.*/
    if (user)
      throw new DomainException({
        code: DomainExceptionCode.NotUniqueEmailToCreateUser,
        message: 'Email must be unique',
        field: 'email',
      });

    /*Если пользователь еще не был создан, то просим адаптер "Argon2Adapter" сгенерировать хеш для пароля.*/
    const passwordHash: string = await this.argon2Adapter.generatePasswordHash(dto.password);
    /*Просим модель "UserModel" создать подтвержденного пользователя.*/
    user = this.userModel.createInstance({ login: dto.login, email: dto.email, passwordHash }, true);
    /*Просим репозиторий "UsersRepository" сохранить пользователя в БД.*/
    await this.usersRepository.save(user);
    /*Преобразовываем пользователя из БД в подготовленного для отправки клиенту
    пользователя и возвращаем его.*/
    return UserOutputDTO.mapFromUserDocumentTypeToUserOutputDTO(user);
  }

  /*Метод для поиска пользователя по ID без выброса исключений.*/
  public async findByIdWithoutExceptions(id: string): Promise<UserDocumentType | null> {
    /*Просим репозиторий "UsersRepository" найти пользователя по ID в БД.*/
    return await this.usersRepository.findById(id);
  }

  /*Метод для поиска пользователя по логину без выброса исключений.*/
  public async findByLoginWithoutExceptions(login: string): Promise<UserDocumentType | null> {
    /*Просим репозиторий "UsersRepository" найти пользователя по логину в БД.*/
    return await this.usersRepository.findByLogin(login);
  }

  /*Метод для поиска пользователя по логину или email без выброса исключений.*/
  public async findByLoginOrEmailWithoutExceptions(loginOrEmail: string): Promise<UserDocumentType | null> {
    /*Просим репозиторий "UsersRepository" найти пользователя по логину или email в БД.*/
    return await this.usersRepository.findByLoginOrEmail(loginOrEmail);
  }

  /*Метод для поиска пользователя по email без выброса исключений.*/
  public async findByEmailWithoutExceptions(email: string): Promise<UserDocumentType | null> {
    /*Просим репозиторий "UsersRepository" найти пользователя по email в БД.*/
    return await this.usersRepository.findByEmail(email);
  }

  /*Метод для подтверждения регистрации пользователя по коду подтверждения регистрации пользователя.*/
  public async confirmByCode(dto: ConfirmUserByCodeDTO): Promise<void> {
    /*Просим репозиторий "AuthRepository" найти данные о подтверждении регистрации пользователя по коду подтверждения
    регистрации пользователя.*/
    const emailConfirmation: EmailConfirmationDocumentType | null =
      await this.authRepository.findEmailConfirmationByCode(dto.code);

    /*Если данные о подтверждении регистрации пользователя не были найдены, то выбрасываем исключение с информацией об
    этом.*/
    if (!emailConfirmation)
      throw new DomainException({
        code: DomainExceptionCode.InvalidUserRegistrationConfirmationCode,
        message: 'Confirmation code is invalid',
        field: 'code',
      });

    /*Если срок действия кода подтверждения регистрации пользователя истек, то выбрасываем исключение с информацией об
    этом.*/
    if (emailConfirmation.expirationDate <= new Date())
      throw new DomainException({
        code: DomainExceptionCode.ExpiredUserRegistrationConfirmationCode,
        message: 'Confirmation code is expired',
        field: 'code',
      });

    /*Если данные о подтверждении регистрации пользователя были найдены и срок действия кода подтверждения регистрации
    пользователя не истек, то получаем ID пользователя.*/
    const userId: string = emailConfirmation.userId;
    /*Просим сервис "UsersService" найти пользователя по ID без выброса исключений.*/
    const user: UserDocumentType | null = await this.findByIdWithoutExceptions(userId);

    /*Если пользователь не был найден, то выбрасываем исключение с информацией об этом.*/
    if (!user)
      throw new DomainException({
        code: DomainExceptionCode.UserNotFoundWhileRegistrationConfirmation,
        message: 'User to confirm registration not found',
        field: 'id',
      });

    /*Если регистрация пользователя уже была подтверждена, то выбрасываем исключение с информацией об этом.*/
    if (user.isConfirmed)
      throw new DomainException({
        code: DomainExceptionCode.AlreadyConfirmedUserRegistration,
        message: 'Registration has already been confirmed',
        field: 'code',
      });

    /*Если пользователь был найден и его регистрация еще не была подтверждена, то подтверждаем регистрацию
    пользователя.*/
    user.confirmUser();
    /*Просим репозиторий "UsersRepository" сохранить подтвержденного пользователя в БД.*/
    await this.usersRepository.save(user);
    /*Просим репозиторий "AuthRepository" удалить все данные о подтверждении регистрации пользователя по ID пользователя
    в БД.*/
    await this.authRepository.deleteAllEmailConfirmationsByUserId(userId);
  }

  /*Метод для изменения пароля пользователя по коду восстановления пароля пользователя.*/
  public async updatePasswordByPasswordRecoveryCode(dto: UpdatePasswordByPasswordRecoveryCodeDTO): Promise<void> {
    /*Просим репозиторий "AuthRepository" найти данные о коде восстановления пароля пользователя по коду восстановления
    пароля пользователя в БД.*/
    const passwordRecoveryCodeData: PasswordRecoveryCodeDataDocumentType | null =
      await this.authRepository.findRecoveryPasswordCodeDataByPasswordRecoveryCode(dto.recoveryCode);

    /*Если данные о коде восстановления пароля пользователя не были найдены, то выбрасываем исключение с информацией об
    этом.*/
    if (!passwordRecoveryCodeData)
      throw new DomainException({
        code: DomainExceptionCode.InvalidPasswordRecoveryCode,
        message: 'Password recovery code is invalid',
        field: 'recoveryCode',
      });

    /*Если срок действия кода восстановления пароля пользователя истек, то выбрасываем исключение с информацией об
    этом.*/
    if (passwordRecoveryCodeData.expirationDate <= new Date())
      throw new DomainException({
        code: DomainExceptionCode.ExpiredPasswordRecoveryCode,
        message: 'Password recovery code is expired',
        field: 'recoveryCode',
      });

    /*Если данные о коде восстановления пароля пользователя были найдены, то получаем ID пользователя.*/
    const userId: string = passwordRecoveryCodeData.userId;
    /*Просим сервис "UsersService" найти пользователя по ID без выброса исключений.*/
    const user: UserDocumentType | null = await this.findByIdWithoutExceptions(userId);

    /*Если пользователь не был найден, то выбрасываем исключение с информацией об этом.*/
    if (!user)
      throw new DomainException({
        code: DomainExceptionCode.UserNotFoundWhilePasswordRecovery,
        message: 'User to recover password not found',
        field: 'code',
      });

    /*Если пользователь был найден, то просим адаптер "Argon2Adapter" сгенерировать хеш для пароля.*/
    const passwordHash: string = await this.argon2Adapter.generatePasswordHash(dto.password);
    /*Изменяем хеш для пароля пользователя.*/
    user.updateUserPasswordHash({ passwordHash });
    /*Просим репозиторий "UsersRepository" сохранить измененного пользователя в БД.*/
    await this.usersRepository.save(user);
    /*Просим репозиторий "AuthRepository" удалить данные о всех кодах восстановления пароля пользователя ID пользователя
    в БД.*/
    await this.authRepository.deleteAllRecoveryCodesDataByUserId(userId);
  }

  /*Метод для soft удаления пользователя по ID.*/
  public async markAsDeleted(id: string): Promise<void> {
    /*Просим сервис "UsersService" найти пользователя по ID без выброса исключений.*/
    const user: UserDocumentType | null = await this.findByIdWithoutExceptions(id);

    /*Если пользователь не был найден, то выбрасываем исключение с информацией об этом.*/
    if (!user)
      throw new DomainException({
        code: DomainExceptionCode.UserNotFoundWhileDeleting,
        message: 'User to delete not found',
        field: 'code',
      });

    /*Если пользователь был найден, то помечаем его как удаленного.*/
    user.markAsDeleted();
    /*Просим репозиторий "UsersRepository" сохранить удаленного пользователя в БД.*/
    await this.usersRepository.save(user);
  }

  /*Метод для hard удаления пользователя по ID.*/
  public async delete(id: string): Promise<void> {
    /*Просим сервис "UsersService" найти пользователя по ID без выброса исключений.*/
    const user: UserDocumentType | null = await this.findByIdWithoutExceptions(id);

    /*Если пользователь не был найден, то выбрасываем исключение с информацией об этом.*/
    if (!user)
      throw new DomainException({
        code: DomainExceptionCode.UserNotFoundWhileDeleting,
        message: 'User to delete not found',
        field: 'code',
      });

    /*Если пользователь был найден, то просим репозиторий "UsersRepository" удалить пользователя по ID в БД.*/
    await this.usersRepository.deleteById(id);
  }
}
