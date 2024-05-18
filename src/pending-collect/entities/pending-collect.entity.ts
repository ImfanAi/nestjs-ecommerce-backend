import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('PendingCollect')
export class PendingCollect {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Index()
    address: string;

    @Column()
    network: string;

    @Column()
    coin: string;

    @Column({nullable: true})
    contractAddress?: string;

    @Column({nullable: true})
    transactionHash: string;

    @Column()
    pending: boolean;

    @Column()
    baseTxHash: string;

    @Column()
    sentBase: boolean;

    @Column({type: 'timestamp'})
    createdAt: Date;

    @Column({type: 'timestamp', nullable: true})
    updatedAt: Date;
}