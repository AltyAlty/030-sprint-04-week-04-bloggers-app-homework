import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { SETTINGS } from './core/settings/settings';
import { appSetup } from './setup/app.setup';

/*Функция для запуска приложения.*/
async function bootstrap(): Promise<void> {
  /*Создаем экземпляр приложения NestJS.*/
  const app: INestApplication = await NestFactory.create(AppModule);
  /*Подключаем middleware для работы с cookies.*/
  app.use(cookieParser());
  /*Настраиваем экземпляр приложения NestJS.*/
  appSetup(app);
  /*Указываем порт для экземпляра приложения NestJS.*/
  const PORT: string | number = SETTINGS.PORT || 5001;
  /*Запускаем экземпляр приложения NestJS.*/
  await app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

/*Запускаем приложение.*/
bootstrap();
