import { IsBoolean, IsString } from "class-validator";
import { TFA_TYPE } from "../entities/security.entity";

export class CreateSecurityDto {
    @IsBoolean()
    public emailVerified: boolean

    @IsBoolean()
    public tfaEnabled: boolean

    @IsString()
    public tfaType: TFA_TYPE

    @IsString()
    public backup: string;

    @IsString()
    public googleSecret: string
}
