import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SecurityDevicesRepository } from '../../infrastructure/security-devices/security-devices.repository';
import { SecurityDeviceDocumentType } from '../../domain/security-devices/document-types/security-device.document-type';
import type { SecurityDeviceModelType } from '../../domain/security-devices/model-types/security-device.model-type';
import { SecurityDevice } from '../../domain/security-devices/security-device.entity';
import { CreateSecurityDeviceDTO } from './dto/create-security-device.dto';
import { UpdateSecurityDeviceDTO } from './dto/update-security-device.dto';

/*Сервис для пользовательских устройств.*/
@Injectable()
export class SecurityDevicesService {
  public constructor(
    @InjectModel(SecurityDevice.name)
    private readonly securityDeviceModel: SecurityDeviceModelType,
    private readonly securityDevicesRepository: SecurityDevicesRepository
  ) {}

  /*Метод для создания пользовательского устройства.*/
  public async create(dto: CreateSecurityDeviceDTO): Promise<void> {
    /*Просим модель "SecurityDeviceModel" создать пользовательское устройство.*/
    const securityDevice: SecurityDeviceDocumentType = this.securityDeviceModel.createInstance(dto);
    /*Просим репозиторий "SecurityDevicesRepository" сохранить пользовательское устройство в БД.*/
    await this.securityDevicesRepository.save(securityDevice);
  }

  /*Метод для поиска пользовательского устройства по ID без выброса исключений.*/
  public async findByIdWithoutExceptions(id: string): Promise<SecurityDeviceDocumentType | null> {
    /*Просим репозиторий "SecurityDevicesRepository" найти пользовательское устройство по ID в БД.*/
    return await this.securityDevicesRepository.findById(id);
  }

  /*Метод для изменения пользовательского устройства по ID.*/
  public async updateById(id: string, dto: UpdateSecurityDeviceDTO): Promise<void> {
    /*Просим сервис "SecurityDevicesService" найти пользовательское устройство по ID без выброса исключений.*/
    const securityDevice: SecurityDeviceDocumentType | null = await this.findByIdWithoutExceptions(id);

    /*Если пользовательское устройство было найдено, то изменяем его.*/
    if (securityDevice) {
      securityDevice.update({ title: dto.title, ip: dto.ip, lastActiveDate: dto.lastActiveDate });
      /*Просим репозиторий "SecurityDevicesRepository" сохранить измененное пользовательское устройство в БД.*/
      await this.securityDevicesRepository.save(securityDevice);
    }
  }

  /*Метод для hard удаления пользовательского устройства по ID без выброса исключений.*/
  public async deleteByIdWithoutExceptions(id: string): Promise<void> {
    /*Просим репозиторий "SecurityDevicesRepository" удалить пользовательское устройство по ID в БД.*/
    await this.securityDevicesRepository.deleteById(id);
  }

  /*Метод для hard удаления всех пользовательских устройств, кроме текущего, по ID пользовательского устройства и ID
  пользователя без выброса исключений.*/
  public async deleteAllExceptCurrentOneBySecurityDeviceIdAndUserId(id: string, userId: string): Promise<void> {
    /*Просим репозиторий "SecurityDevicesRepository" удалить все пользовательские устройства, кроме текущего, по ID
    пользовательского устройства и ID пользователя в БД.*/
    await this.securityDevicesRepository.deleteAllExceptCurrentOneBySecurityDeviceIdAndUserId(id, userId);
  }
}
