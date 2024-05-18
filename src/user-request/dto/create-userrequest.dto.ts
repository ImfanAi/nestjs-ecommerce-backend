import { IsDate, IsNotEmpty, IsString } from "class-validator";
import { User } from "src/users/entities/user.entity";
import { REQUEST_TYPE } from "../entities/user-request.entity";

export class CreateUserRequest {
    @IsNotEmpty()
    user: User;

    @IsDate()
    @IsNotEmpty()
    requestedAt: Date;

    @IsString()
    @IsNotEmpty()
    requestType: REQUEST_TYPE;

}