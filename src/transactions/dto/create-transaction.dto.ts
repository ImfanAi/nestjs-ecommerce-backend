import { IsDate, IsNotEmpty, IsString } from "class-validator";
import { PaymentRequest } from "src/request/entities/paymentRequest.entity";
import { Token } from "src/tokens/token.entity";

export class CreateTransactionDto {
    @IsNotEmpty()
    public token: Token;

    @IsString()
    @IsNotEmpty()
    public txnHash: string;

    @IsString()
    @IsNotEmpty()
    public amount: string;

    @IsString()
    @IsNotEmpty()
    public logId: string;

    @IsDate()
    public createdAt: Date;

    public request: PaymentRequest
}
