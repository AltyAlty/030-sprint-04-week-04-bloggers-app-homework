import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DomainExceptionFilter } from './core/exception-filters/domain/domain.exception-filter';
import { SETTINGS } from './core/settings/settings';
import { BlogModule } from './modules/blog/blog.module';
import { UserModule } from './modules/user/user.module';
import { TestingModule } from './testing/testing.module';

/*Главный обязательный модуль приложения.*/
@Module({
  imports: [
    /*Подключаем файл ".env".*/
    ConfigModule.forRoot({
      /*Делаем модуль глобальным, чтобы не нужно было его импортировать в каждый модуль.*/
      isGlobal: true,
      /*Путь к файлу ".env" (если файл лежит в корне проекта, то можно не указывать).*/
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(SETTINGS.MONGO_URL, { dbName: SETTINGS.DB_NAME }),
    BlogModule,
    UserModule,
    TestingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    /*Регистрация глобальных фильтров исключений.*/
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class AppModule {}
