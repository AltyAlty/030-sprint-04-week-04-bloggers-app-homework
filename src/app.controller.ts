import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

/*Необязательный контроллер для модуля "AppModule".*/
@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Greet the World!' })
  @ApiOkResponse({ description: 'The world has been greeted!' })
  @Get()
  @HttpCode(HttpStatus.OK)
  public hello(): string {
    return this.appService.hello();
  }
}
