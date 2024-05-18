import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsString, IsUrl } from 'class-validator';
import { WITHDRAW_ADDRESS } from '../entities/setting.entity';
import { CreateSettingDto } from './create-setting.dto';

export class UpdateSettingDto extends PartialType(CreateSettingDto) {
    @IsNumber()
    public withdraw?: number;

    public withdrawAddresses?: WITHDRAW_ADDRESS[]
}
