import { User } from "src/users/entities/user.entity";
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, Index } from "typeorm";

export type WITHDRAW_ADDRESS = {
    network: string;
    address: string;
}

@Entity()
export class Setting {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({unique: true})
    @Column({unique: true})
    pubKey?: string;

    @Column()
    privKey?: string;

    // default manual withdraw
    // 0 - instant withdraw
    // 1 - daily
    // 7 - weekly
    // 30 - monthly
    // 365 - yearly
    @Column({default: -1})
    withdraw: number

    // withdrawal address based on network
    @Column({
        type: 'jsonb',
        default: [{}],
        nullable: false,
        name: 'withdraw_address'
    })
    withdrawAddresses: WITHDRAW_ADDRESS[];

    @OneToOne(() => User, user => user.setting)
    user: User;
}
