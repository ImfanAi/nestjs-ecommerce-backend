import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";

@Entity()
export class Token {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({length: 255})
    address: string;
    
    @Index()
    @Column()
    name: string;

    @Column()
    network: string; // short name

    @Column()
    chain: string; // full name

    @Column({default: 18})
    decimal: number;

    @Column()
    syncBlock: string;
}