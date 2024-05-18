import { Address } from "src/address/entity/address.entity";
import { Transaction } from "src/transactions/entities/transaction.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PaymentRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.paymentRequests)
    @JoinColumn({name: 'user_id'})
    user: User;

    @Column()
    network: string;

    @Column()
    coin: string;

    @Column()
    callback: string;

    @Column({default: 0})
    received: number;

    @OneToMany(() => Transaction, (transaction) => transaction.paymentRequest)
    @JoinColumn({
        name: 'transaction_id'
    })
    transactions: Transaction[]

    @Column({default: 'pending'})
    status: string;

    @Column({
        name: 'deposit_type'
    })
    depositType: string;

    @ManyToOne(() => Address, (address) => address.paymentRequests)
    @JoinColumn({name: 'address_id'})
    address?: Address;

    @Column({
        type: 'timestamp',
        name: 'created_at'
    })
    createdAt: Date;

    @Column({
        type: 'timestamp',
        nullable: true,
        name: 'updated_at'
    })
    updatedAt: Date

// for checkout request!
    @Column({
        nullable: true,
        name: 'checkout_amount'
    })
    checkoutAmount?: number;

    @Column({nullable: true})
    product?: string;

    @Column({
        nullable: true,
        name: 'unit_price'
    })
    unitPrice?: number;

    @Column({nullable: true})
    quantity?: number;
}
