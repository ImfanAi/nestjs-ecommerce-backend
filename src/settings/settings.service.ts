import { Inject, Injectable } from '@nestjs/common';
import { maxLength } from 'class-validator';
import { AbstractService } from 'src/common/abstract.service';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateSecurityDto } from './dto/create-security.dto';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Security, TFA_TYPE } from './entities/security.entity';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService extends AbstractService {
  constructor(
    @Inject('SETTING_REPOSITORY')
    private settingRepository: Repository<Setting>,
    @Inject('SECURITY_REPOSITORY')
    private securityRepository: Repository<Security>
  ) {
    super(settingRepository);
  }

  async update(id: number, setting: UpdateSettingDto) {
    return await super.update(id, setting);
  }

  remove(id: number) {
    return `This action removes a #${id} setting`;
  }

  // helper functions
  generateRandomString(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charLen = characters.length;
    let keyLength = 0;
    if(!length) keyLength = process.env.KEY_LENGTH as unknown as number;
    else keyLength = length;

    let key = '';
    for(let i = 0; i < length; i++) {
      key += characters.charAt(Math.floor(Math.random() * charLen));
    }
    return key;
  }

  generateKeyPair(length: number): CreateSettingDto {
    // generate key
    let privKey = 'sk_';
    let pubKey = 'pk_';
    privKey += this.generateRandomString(length);
    pubKey += this.generateRandomString(length);
    return { privKey, pubKey }
  }

  async findByWithdrawSetting(withdraw: number) {
    return await this.settingRepository
      .find({where: {withdraw}, relations: {user: true}})
  }

  /////////////////////////// User Security Setting ////////////////////////////////
  generateSecurity(): CreateSecurityDto {
    // generate backup code!
    const backup = this.generateRandomString(64);
    return {
      emailVerified: false,
      tfaEnabled: false,
      tfaType: null,
      googleSecret: null,
      backup
    }
  }

  async setEmailVerified(id: number) {
    return await this.securityRepository.update(
      {id}, {emailVerified: true}
    );
  }

  async setTfa(id: number, tfaType: TFA_TYPE, secret?: string, phone?: string) {
    return await this.securityRepository.update(
      {id}, {tfaEnabled: true, tfaType, googleSecret: secret}
    )
  }

  async resetTfa(id: number) {
    return await this.securityRepository.update(
      {id}, {tfaEnabled: false}
    )
  }
}
