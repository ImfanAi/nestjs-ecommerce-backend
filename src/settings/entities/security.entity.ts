import { Exclude } from "class-transformer";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";

export enum TFA_TYPE {
    GOOGLE = "GOOGLE",
    EMAIL = "EMAIL",
    // PHONE = "PHONE"
}

@Entity()
export class Security {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({default: true})
    emailVerified: boolean;

    @Column({default: false})
    tfaEnabled: boolean;

    @Column('text', {nullable: true})
    tfaType: TFA_TYPE;

    @Column({nullable: true})
    @Exclude()
    googleSecret?: string;

    @Column()
    backup: string;

    @OneToOne(() => User, user => user.setting)
    user: User;

    // @Column({nullable: true})
    // phone: string;
}
