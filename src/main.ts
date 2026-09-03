import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { CoreConfig } from './core/config/core.config';
import { appSetup } from './setup/app.setup';

/*Функция для запуска приложения.*/
async function bootstrap(): Promise<void> {
  /*Создаем экземпляр приложения NestJS.*/
  const app: INestApplication = await NestFactory.create(AppModule);
  /*Получаем экземпляр класса "CoreConfig".*/
  const coreConfig: CoreConfig = app.get<CoreConfig>(CoreConfig);
  /*Подключаем middleware для работы с cookies.*/
  app.use(cookieParser());
  /*Настраиваем экземпляр приложения NestJS.*/
  appSetup(app);
  /*Указываем порт для экземпляра приложения NestJS.*/
  const PORT: number = coreConfig.PORT;
  /*Запускаем экземпляр приложения NestJS.*/
  await app.listen(PORT, (): void => console.log(`Server started. PORT: ${PORT}. NODE_ENV: ${coreConfig.NODE_ENV}`));
}

/*Запускаем приложение.*/
bootstrap();
