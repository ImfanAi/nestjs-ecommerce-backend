import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PaymentRequest } from "src/request/entities/paymentRequest.entity";

@Entity()
export class Address {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    network: string;

    @Index()
    @Column({length: 255, unique: true})
    address: string;

    @Column()
    privateKey: string;

    @Column({default: true})
    available: boolean

    @Column({type: 'timestamp'})
    activatedAt: Date;

    // one to many relations into requests!
    @OneToMany(() => PaymentRequest, (paymentRequest) => paymentRequest.address)
    paymentRequests: PaymentRequest[]
}
