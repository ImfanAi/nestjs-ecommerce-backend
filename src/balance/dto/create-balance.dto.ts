import { IsNotEmpty, IsNumber } from "class-validator";
import { Token } from "src/tokens/token.entity";
import { User } from "src/users/entities/user.entity";

export class CreateBalanceDto {
    @IsNotEmpty()
    public user: User;

    @IsNotEmpty()
    public token: Token;
}
