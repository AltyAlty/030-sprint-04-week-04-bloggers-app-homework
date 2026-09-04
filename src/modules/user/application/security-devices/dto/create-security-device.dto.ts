/*DTO для создания пользовательского устройства.*/
export class CreateSecurityDeviceDTO {
  public deviceId: string;
  public userId: string;
  public title: string;
  public ip: string;
  public lastActiveDate: Date;
}
