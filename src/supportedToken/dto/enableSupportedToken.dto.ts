import { IsBoolean, IsNotEmpty, IsString } from "class-validator";
import { User } from "src/users/entities/user.entity";

export class EnableSupportedToken {
    @IsNotEmpty()
    @IsBoolean()
    public flag: boolean;

    @IsString()
    @IsNotEmpty()
    public network: string;

    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsNotEmpty()
    public user?: User
}
