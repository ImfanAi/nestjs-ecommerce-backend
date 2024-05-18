import { IsBoolean, IsDate, IsString } from "class-validator";

export class UpdatePendingCollectDto {
    @IsString()
    baseTxHash?: string;

    @IsBoolean()
    pending: boolean;

    @IsString()
    transactionHash: string;

    @IsBoolean()
    sentBase?: boolean;

    @IsDate()
    updatedAt: Date;
}
