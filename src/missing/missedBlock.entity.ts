import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * This block is for Solana block.
 * I don't know why there are such blocks cannot fetch.
 */
@Entity()
export class MissedBlock {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    blockNumber: number;

    // There could be missed block in other network!
    @Column()
    network: string;

    @Column()
    retry: number;

    @Column()
    fetched: boolean;

    @Column()
    createdAt: string;

    @Column()
    updatedAt: string;
}
