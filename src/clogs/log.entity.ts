import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Log {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    type: string;

    @Column()
    content: string;

    @Column()
    logDate: string;
}