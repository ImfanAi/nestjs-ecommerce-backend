import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { User } from "src/users/entities/user.entity";

export class CreateCallbackStatusDto {
    @IsNotEmpty()
    public user: User;

    @IsNotEmpty()
    @IsString()
    public callback: string;

    @IsNotEmpty()
    @IsString()
    public content: string;

    @IsNotEmpty()
    @IsString()
    public status: string;

    @IsNotEmpty()
    @IsNumber()
    public statusCode: number;
}
