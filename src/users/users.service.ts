import { BadRequestException, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { SettingsService } from 'src/settings/settings.service';
import { MailService } from 'src/mail/mail.service';
import { UtilsService } from 'src/utils/utils.service';
import { Cache } from 'cache-manager';
import { AbstractService } from 'src/common/abstract.service';

@Injectable()
export class UsersService extends AbstractService{
  constructor(
    @Inject('USER_REPOSITORY') private userRepository: Repository<User>,
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
    private settingsService: SettingsService,
    private mailService: MailService,
    private utilService: UtilsService
  ) {
    super(userRepository);
  }

  async create(createUserDto: CreateUserDto) {
    try {
      // hash password
      const salt = await bcrypt.genSalt();
      createUserDto.password = await bcrypt.hash(createUserDto.password, salt);

      // generate pub/priv key pairs
      createUserDto.setting = this.settingsService.generateKeyPair(64);
      createUserDto.security = this.settingsService.generateSecurity();
      const user = await super.create(createUserDto);

      // send verify email
      const token = this.utilService.generateRandomId(64);
      const _user: any = user;
      _user.verify = 'email';

      await this.cacheManager.set(token, _user, {ttl: 300});
      const sent = await this.mailService.sendUserConfirmation(_user, token);
      if(sent == null) {
        // must call resent verification email
        throw new HttpException({
          status: HttpStatus.BAD_GATEWAY,
          error: 'Cannot send verification email'
        }, HttpStatus.BAD_GATEWAY);
      }
      return {
        status: 'success',
        msg: 'Please verify your account'
      }
    } catch (error) {
      console.log('------- cannot create user --------', error);
      throw new BadRequestException('Cannot create new user')
    }
  }

  async resetPassword(email: string, newPassword: string) {
    const salt = await bcrypt.genSalt();
    const hashed = await bcrypt.hash(newPassword, salt);

    await this.userRepository.update({email}, {password: hashed});
  }

  async findAll(page: number = 1, take: number = 15) {

    const {meta, data: users} = await super.paginate(page, take, ['security', 'setting']);

    return {
      data: users.map(user => {
        // skip pub/priv key pairs
        const {pubKey, privKey, ...setting} = user.setting;
        user.setting = setting;

        return user;
      }),
      meta
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.userRepository.update({id}, updateUserDto);
    return {
      status: 'success'
    }
  }

  async remove(id: number) {
    await this.userRepository.update({id}, {deleted: true});
    return {
      status: 'success'
    }
  }

  async removeByEmail(email: string) {
    await this.userRepository.delete({email});
  }
}
