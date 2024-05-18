import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn, Index } from "typeorm";
import { Token } from "src/tokens/token.entity";
import { User } from "src/users/entities/user.entity";
import { Setting } from "src/settings/entities/setting.entity";
import { PaymentRequest } from "src/request/entities/paymentRequest.entity";

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Token)
    @JoinColumn()
    token: Token;

    @Column({unique: true})
    logId: string;

    @Index()
    @Column()
    txnHash: string;

    @Column()
    amount: string;

    @Column({type: 'timestamp'})
    createdAt: Date;

    @ManyToOne(() => PaymentRequest, (paymentRequest) => paymentRequest.transactions)
    paymentRequest: PaymentRequest
}
