import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EmailConfirmationDocumentType } from '../../domain/auth/document-types/email-confirmation.document-type';
import { PasswordRecoveryCodeDataDocumentType } from '../../domain/auth/document-types/password-recovery-code-data.document-type';
import { EmailConfirmation } from '../../domain/auth/email-confirmation.entity';
import type { EmailConfirmationModelType } from '../../domain/auth/model-types/email-confirmation.model-type';
import type { PasswordRecoveryCodeDataModelType } from '../../domain/auth/model-types/password-recovery-code-data.model-type';
import { PasswordRecoveryCodeData } from '../../domain/auth/password-recovery-code-data.entity';

/*Репозиторий для работы с аутентификацией и авторизацией в БД.*/
@Injectable()
export class AuthRepository {
  public constructor(
    @InjectModel(EmailConfirmation.name) private readonly emailConfirmationModel: EmailConfirmationModelType,
    @InjectModel(PasswordRecoveryCodeData.name)
    private readonly passwordRecoveryCodeDataModel: PasswordRecoveryCodeDataModelType
  ) {}

  /*Метод для сохранения данных о подтверждении регистрации пользователя в БД.*/
  public async saveEmailConfirmation(emailConfirmation: EmailConfirmationDocumentType): Promise<void> {
    await emailConfirmation.save();
  }

  /*Метод для сохранения данных о коде восстановления пароля пользователя в БД.*/
  public async savePasswordRecoveryCodeData(
    passwordRecoveryCodeData: PasswordRecoveryCodeDataDocumentType
  ): Promise<void> {
    await passwordRecoveryCodeData.save();
  }

  /*Метод для поиска данных о подтверждении регистрации пользователя по ID пользователя в БД.*/
  public async findEmailConfirmationByUserId(userId: string): Promise<EmailConfirmationDocumentType | null> {
    /*Просим модель "EmailConfirmationModel" найти данные о подтверждении регистрации пользователя по ID пользователя в
    БД.*/
    return await this.emailConfirmationModel.findOne({ userId });
  }

  /*Метод для поиска данных о подтверждении регистрации пользователя по коду подтверждения регистрации пользователя в
  БД.*/
  public async findEmailConfirmationByCode(confirmationCode: string): Promise<EmailConfirmationDocumentType | null> {
    /*Просим модель "EmailConfirmationModel" найти данные о подтверждении регистрации пользователя по коду подтверждения
    регистрации пользователя в БД.*/
    return await this.emailConfirmationModel.findOne({ confirmationCode });
  }

  /*Метод для поиска данных о коде восстановления пароля пользователя по ID пользователя в БД.*/
  public async findRecoveryPasswordCodeDataByUserId(
    userId: string
  ): Promise<PasswordRecoveryCodeDataDocumentType | null> {
    /*Просим модель "PasswordRecoveryCodeDataModel" найти данные о коде восстановления пароля пользователя по ID
    пользователя в БД.*/
    return await this.passwordRecoveryCodeDataModel.findOne({ userId });
  }

  /*Метод для поиска данных о коде восстановления пароля пользователя по коду восстановления пароля пользователя в БД.*/
  public async findRecoveryPasswordCodeDataByPasswordRecoveryCode(
    passwordRecoveryCode: string
  ): Promise<PasswordRecoveryCodeDataDocumentType | null> {
    /*Просим модель "PasswordRecoveryCodeDataModel" найти данные о коде восстановления пароля пользователя по коду
    восстановления пароля пользователя в БД.*/
    return await this.passwordRecoveryCodeDataModel.findOne({ passwordRecoveryCode });
  }

  /*Метод для удаления всех данных о подтверждении регистрации пользователя по ID пользователя в БД.*/
  public async deleteAllEmailConfirmationsByUserId(userId: string): Promise<void> {
    /*Просим модель "EmailConfirmationModel" удалить все данные о подтверждении регистрации пользователя по ID
    пользователя в БД.*/
    await this.emailConfirmationModel.deleteMany({ userId });
  }

  /*Метод для удаления данных о всех кодах восстановления пароля пользователя по ID пользователя в БД.*/
  public async deleteAllRecoveryCodesDataByUserId(userId: string): Promise<void> {
    /*Просим модель "PasswordRecoveryCodeDataModel" удалить данные о всех кодах восстановления пароля пользователя по ID
    пользователя в БД.*/
    await this.passwordRecoveryCodeDataModel.deleteMany({ userId });
  }
}
