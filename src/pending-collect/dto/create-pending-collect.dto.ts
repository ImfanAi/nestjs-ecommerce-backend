import { IsBoolean, IsDate, IsNotEmpty, IsString } from "class-validator";

export class CreatePendingCollectDto {
    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsNotEmpty()
    network: string;

    @IsString()
    @IsNotEmpty()
    baseTxHash: string;

    @IsBoolean()
    sentBase: boolean;

    @IsBoolean()
    pending: boolean;

    @IsDate()
    createdAt: Date;
}