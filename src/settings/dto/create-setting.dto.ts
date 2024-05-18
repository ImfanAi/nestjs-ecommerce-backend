import { IsString, IsNotEmpty } from "class-validator";

export class CreateSettingDto {
    @IsString()
    @IsNotEmpty()
    public privKey: string;

    @IsString()
    @IsNotEmpty()
    public pubKey: string;
}
