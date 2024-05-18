import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class CallbackStatus {
    @PrimaryGeneratedColumn()
    id: number;

    // who
    @ManyToOne(() => User, user => user.callbackStatus)
    @JoinColumn({name: 'user_id'})
    user: User;

    // where
    @Column()
    callback: string;

    // what
    @Column()
    content: string;

    @Column()
    status: string;

    @Column()
    statusCode: number;
}
