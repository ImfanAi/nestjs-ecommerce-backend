import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { CreateSecurityDto } from "src/settings/dto/create-security.dto";
import { CreateSettingDto } from "src/settings/dto/create-setting.dto";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    public email: string;

    @IsString()
    @IsNotEmpty()
    public password: string;

    @IsString()
    @IsNotEmpty()
    public firstName: string;

    @IsString()
    @IsNotEmpty()
    public lastName: string;

    public setting?: CreateSettingDto;

    public security?: CreateSecurityDto;
}
