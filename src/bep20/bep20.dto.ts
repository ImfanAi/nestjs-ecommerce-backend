import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';
import { Setting } from 'src/settings/entities/setting.entity';
import { User } from 'src/users/entities/user.entity';

export class CreateBep20Dto {
    @IsString()
    @IsNotEmpty()
    public address: string;

    @IsBoolean()
    public isExpired?: boolean;

    public user?: User;

    public setting?: Setting;
}