import { IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateCollectorDto {
    @IsString()
    @IsNotEmpty()
    public network: string;

    @IsString()
    @IsNotEmpty()
    public coin: string;

    @IsString()
    @IsNotEmpty()
    public address: string;

    @IsString()
    @IsNotEmpty()
    public amount: string;

    @IsDate()
    @IsNotEmpty()
    public createdAt: Date;

    @IsNumber()
    @IsNotEmpty()
    public status: number;
}