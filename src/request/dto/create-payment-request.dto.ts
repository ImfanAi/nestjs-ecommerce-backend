import { IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Address } from "src/address/entity/address.entity";
import { User } from "src/users/entities/user.entity";

export class CreatePaymentRequestDto {

    public user: User;

    @IsString()
    @IsNotEmpty()
    public network: string;

    @IsString()
    @IsNotEmpty()
    public coin: string;

    @IsString()
    @IsNotEmpty()
    public callback: string;

    @IsNotEmpty()
    public address: Address;

    @IsString()
    @IsNotEmpty()
    public depositType: string;

    @IsNumber()
    public checkoutAmount?: number;

    @IsString()
    public product?: string;

    @IsNumber()
    public unitPrice?: number;

    @IsNumber()
    public quantity?: number;

    @IsDate()
    public createdAt: Date;

}
