import { IsDate, IsNotEmpty, IsString } from "class-validator";

export class CreateAddressDto {
    @IsString()
    @IsNotEmpty()
    public address: string;

    @IsString()
    @IsNotEmpty()
    public privateKey: string;

    @IsString()
    @IsNotEmpty()
    public network: string;

    @IsDate()
    @IsNotEmpty()
    public activatedAt: Date;
}
