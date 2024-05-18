import { Setting } from "src/settings/entities/setting.entity";
import { User } from "src/users/entities/user.entity";
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from "typeorm";

@Entity()
export class Bep20 {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({length: 255, unique: true})
    address: string;

    @Column('boolean', {default: false})
    isExpired: boolean;

    @ManyToOne(() => User, {cascade: true})
    @JoinColumn()
    user: User;

    @ManyToOne(() => Setting, {cascade: true})
    @JoinColumn()
    setting: Setting;
}