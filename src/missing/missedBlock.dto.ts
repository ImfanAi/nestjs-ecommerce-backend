import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class MissedBlockDto {
    @IsNumber()
    @IsNotEmpty()
    public blockNumber: number;

    @IsString()
    @IsNotEmpty()
    public network: string;

    @IsNotEmpty()
    public fetched: boolean;

    @IsNumber()
    public retry: number;

    public createdAt: string;
    public updatedAt: string;
}
