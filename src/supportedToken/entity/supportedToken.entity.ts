import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class SupportedToken {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    network: string;

    @Column()
    name: string;

    @Column({default: true})
    flag: boolean;

    @ManyToOne(() => User, (user) => user.supportedTokens, {
        cascade: true
    })
    @JoinColumn({name: 'user_id'})
    user: User;
}
