import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TestingService } from '../application/testing.service';
import { SETTINGS } from '../../core/settings/settings';

/*Контроллер для тестирования приложения.*/
@ApiTags('Testing')
@Controller(SETTINGS.TESTING_PREFIX)
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  /*001. DELETE-запрос по очистке БД.*/
  @ApiOperation({ summary: 'Clear the database' })
  @ApiNoContentResponse({ description: 'The database has been cleared' })
  @Delete(SETTINGS.CLEAR_DB_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async clearDb(): Promise<void> {
    await this.testingService.clearDb();
  }
}
