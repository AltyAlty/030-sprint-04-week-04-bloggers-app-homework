import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { SETTINGS } from '../../settings/settings';
import { EmailManager } from './email-manager/email.manager';

/*Модуль для отправки уведомлений.*/
@Module({
  imports: [
    MailerModule.forRoot({
      /*Создаем транспортер - механизм для работы с почтой. В параметрах метода настраиваем создаваемый транспортер.*/
      transport: {
        /*Имя почтового сервиса.*/
        service: 'gmail',
        auth: {
          /*Адрес почты, используемый для отправки писем.*/
          user: SETTINGS.EMAIL,
          /*Пароль приложения из Google.*/
          pass: SETTINGS.EMAIL_APP_PASS,
        },
      },
      /*Настройка отправителя по умолчанию.*/
      defaults: {
        from: `${SETTINGS.APP_NAME_FOR_NOTIFICATION_MODULE} <${SETTINGS.EMAIL}>`,
      },
    }),
  ],
  providers: [EmailManager],
  exports: [EmailManager],
})
export class NotificationModule {}
