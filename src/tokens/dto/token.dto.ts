import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTokenDto {
    @IsString()
    @IsNotEmpty()
    public address: string;
    
    @IsString()
    @IsNotEmpty()
    public name: string;
    
    @IsString()
    @IsNotEmpty()
    public network: string;

    @IsString()
    @IsNotEmpty()
    public chain: string;

    @IsNumber()
    @IsNotEmpty()
    public decimal: number;

    @IsNumber()
    @IsNotEmpty()
    public syncBlock: string;
}