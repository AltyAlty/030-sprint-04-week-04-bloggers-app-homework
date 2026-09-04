import { Controller, Delete, Get, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from '../../application/auth/auth.service';
import { SecurityDevicesQueryService } from '../../application/security-devices/security-devices.query-service';
import { ErrorsMessagesSwaggerType } from '../../../../core/validation/types/errors-messages.type';
import { SecurityDeviceOutputDTO } from './output-dto/security-device.output-dto';
import { SecurityDeviceListOutputDTO } from './output-dto/security-device-list.output-dto';
import { UserRefreshJwtAuthContextDTO } from '../../../../core/guards/refresh-jwt-auth/dto/user-refresh-jwt-auth-context.dto';
import { RefreshJwtAuthGuard } from '../../../../core/guards/refresh-jwt-auth/refresh-jwt-auth.guard';
import { SETTINGS } from '../../../../core/settings/settings';
import { ExtractUserDataFromRequest } from '../auth/decorators/param-extraction/extract-user-data-from-request.param-decorator';

/*Контроллер для пользовательских устройств.*/
@ApiTags(SETTINGS.SECURITY_DEVICES_API_TAG)
@Controller(SETTINGS.SECURITY_DEVICES_PREFIX)
export class SecurityDevicesController {
  public constructor(
    private readonly authService: AuthService,
    private readonly securityDevicesQueryService: SecurityDevicesQueryService
  ) {}

  /*001. GET-запрос по получению пользовательских устройств.*/
  @ApiOperation({ summary: `Get a user's devices` })
  @ApiOkResponse({
    description: `Returns a list of a user's devices`,
    type: [SecurityDeviceOutputDTO],
  })
  @ApiUnauthorizedResponse({
    description: 'The refresh JWT is invalid, incorrect or expired',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiCookieAuth('refreshToken')
  @UseGuards(RefreshJwtAuthGuard)
  @Get(SETTINGS.GET_SECURITY_DEVICE_LIST_PATH)
  @HttpCode(HttpStatus.OK)
  public getSecurityDeviceList(
    @ExtractUserDataFromRequest() userRefreshJwtAuthContext: UserRefreshJwtAuthContextDTO
  ): Promise<SecurityDeviceListOutputDTO> {
    /*Просим query-сервис "SecurityQueryDevicesService" найти пользовательские устройства по ID пользователя.*/
    return this.securityDevicesQueryService.findAllByUserId(userRefreshJwtAuthContext.id);
  }

  /*002. DELETE-запрос по отзыву пользовательской сессии по ID пользовательского устройства, используя URI-параметры.*/
  @ApiOperation({ summary: 'Revoke a session by user device ID' })
  @ApiNoContentResponse({ description: 'Revokes the session' })
  @ApiUnauthorizedResponse({
    description: 'The refresh JWT is invalid, incorrect or expired',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiForbiddenResponse({ description: 'The user is not the owner of the device', type: ErrorsMessagesSwaggerType })
  @ApiNotFoundResponse({ description: 'The device does not exist', type: ErrorsMessagesSwaggerType })
  @ApiCookieAuth('refreshToken')
  @ApiParam({ name: 'id', description: 'User device ID', format: 'ObjectId' })
  @UseGuards(RefreshJwtAuthGuard)
  @Delete(SETTINGS.REVOKE_SESSION_BY_DEVICE_ID_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async revokeSessionBySecurityDeviceId(
    @Param('id') id: string,
    @ExtractUserDataFromRequest() userRefreshJwtAuthContext: UserRefreshJwtAuthContextDTO
  ): Promise<void> {
    /*Просим сервис "authService" отозвать пользовательскую сессию по ID пользовательского устройства.*/
    await this.authService.revokeSessionBySecurityDeviceId(id, userRefreshJwtAuthContext);
  }

  /*003. DELETE-запрос по отзыву всех пользовательских сессий, кроме текущей.*/
  @ApiOperation({ summary: 'Revoke all sessions except the current one' })
  @ApiNoContentResponse({ description: 'Revokes all sessions except the current one' })
  @ApiUnauthorizedResponse({
    description: 'The refresh JWT is invalid, incorrect or expired',
    type: ErrorsMessagesSwaggerType,
  })
  @ApiCookieAuth('refreshToken')
  @UseGuards(RefreshJwtAuthGuard)
  @Delete(SETTINGS.REVOKE_ALL_SESSIONS_EXCEPT_CURRENT_ONE_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async revokeAllSessionsExceptCurrentOne(
    @ExtractUserDataFromRequest() userRefreshJwtAuthContext: UserRefreshJwtAuthContextDTO
  ): Promise<void> {
    /*Просим сервис "authService" отозвать все пользовательские сессии, кроме текущей.*/
    await this.authService.revokeAllSessionsExceptCurrentOne(userRefreshJwtAuthContext);
  }
}
