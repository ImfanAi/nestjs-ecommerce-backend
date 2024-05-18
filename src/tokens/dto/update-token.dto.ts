import { IsNumber, IsString } from "class-validator";

export class UpdateTokenDto {
    @IsString()
    address?: string;

    @IsString()
    public name?: string;

    @IsString()
    public network?: string;

    @IsString()
    public chain?: string;

    @IsNumber()
    public decimal?: number;

    @IsNumber()
    public syncBlock?: string;
}
