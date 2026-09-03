import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configModule } from './config.module';
import { CoreConfig, Environments } from './core/config/core.config';
import { CoreModule } from './core/core.module';
import { DomainExceptionFilter } from './core/exception-filters/domain/domain.exception-filter';
import { BlogModule } from './modules/blog/blog.module';
import { UserModule } from './modules/user/user.module';
import { TestingModule } from './testing/testing.module';

/*Главный обязательный модуль приложения.*/
@Module({
  imports: [
    configModule,
    /*Используем динамический модуль, чтобы можно было использовать класс "CoreConfig" для работы с переменными
    окружения.*/
    MongooseModule.forRootAsync({
      imports: [CoreModule],
      inject: [CoreConfig],
      useFactory: (coreConfig: CoreConfig): { uri: string; dbName: string } => ({
        uri: coreConfig.MONGO_URI,
        dbName: coreConfig.DB_NAME,
      }),
    }),
    BlogModule,
    UserModule,
    /*Используем здесь "process.env.NODE_ENV", а не класс "CoreConfig", так как массив "imports" формируется синхронно
    до запуска DI-контейнера и класс "CoreConfig" еще не является созданным на этом этапе, но при это переменная
    "process.env.NODE_ENV" уже является доступной, поскольку она задается через команду в терминале.*/
    ...(process.env.NODE_ENV !== Environments.PRODUCTION ? [TestingModule] : []),
  ],
  controllers: [AppController],
  /*Регистрация глобального фильтра исключений "DomainExceptionFilter".*/
  providers: [AppService, { provide: APP_FILTER, useClass: DomainExceptionFilter }],
})
export class AppModule {}
