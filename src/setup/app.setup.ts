import { INestApplication } from '@nestjs/common';
import { globalPrefixSetup } from './global-prefix.setup';
import { pipesSetup } from './pipes.setup';
import { swaggerSetup } from './swagger.setup';

/*Функция для конфигурирования экземпляров приложения NestJS.*/
export function appSetup(app: INestApplication): void {
  /*Настраиваем pipes для приложения.*/
  pipesSetup(app);
  /*Устанавливаем глобальный префикс ко всем маршрутам приложения.*/
  globalPrefixSetup(app);
  /*Генерируем Swagger-документацию.*/
  swaggerSetup(app);
}
