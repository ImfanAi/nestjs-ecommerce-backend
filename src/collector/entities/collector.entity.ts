import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";

@Entity()
export class Collector {
    @PrimaryGeneratedColumn()
    id: number;
    
    // collected token
    @Column()
    network: string;
    
    @Column()
    coin: string;

    @Column()
    address: string;
    
    // withdrawal information
    @Column()
    amount: string;

    @Column()
    status: number; // 0 pending, 1 success, 2 fail

    @Column({type: 'timestamp'})
    createdAt: Date

    @Column({type: 'timestamp', nullable: true})
    updatedAt: Date
}