import { Token } from "src/tokens/token.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Balance {
    @PrimaryColumn({type: 'int', name: 'user_id'})
    @ManyToOne(() => User, (user) => user.id, {
        nullable: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    })
    @JoinColumn()
    user!: User;

    @PrimaryColumn({type: 'int', name: 'token_id'})
    @ManyToOne(() => Token, (token) => token.id, {
        nullable: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    })
    @JoinColumn()
    token!: Token;

    @Column({default: 0})
    balance: number;

}
