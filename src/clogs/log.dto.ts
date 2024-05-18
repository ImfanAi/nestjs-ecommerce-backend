import { IsNotEmpty, IsString } from "class-validator";

export class LogDto {
    @IsString()
    @IsNotEmpty()
    public type: string;

    @IsString()
    @IsNotEmpty()
    public content: string;

    @IsString()
    @IsNotEmpty()
    public logDate: string;
}