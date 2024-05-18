import { IsDate, IsEmpty, IsNumber, IsString } from "class-validator";
import { User } from "src/users/entities/user.entity";

export class UpdateUserRequestDto {
    @IsEmpty()
    admin: User;

    @IsDate()
    updatedAt: Date;

    @IsString()
    reason: string;

    @IsNumber()
    status: number;
}