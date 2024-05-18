import { Setting } from "src/settings/entities/setting.entity";
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, BeforeInsert, BeforeUpdate, Index, OneToMany } from "typeorm";
import { Exclude, Expose } from 'class-transformer';
import { Security } from "src/settings/entities/security.entity";
import { SupportedToken } from "src/supportedToken/entity/supportedToken.entity";
import { PaymentRequest } from "src/request/entities/paymentRequest.entity";
import { CallbackStatus } from "src/callback-status/entities/callback-status.entity";
import { Role } from "src/auth/role.enum";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({length: 255, unique: true})
    email: string;

    @Column({length: 255})
    @Exclude()
    password: string;

    @Column()
    @Exclude()
    firstName: string;

    @Column()
    @Exclude()
    lastName: string;

    @OneToOne(() => Setting, (setting) => setting.user, {
        cascade: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })
    @JoinColumn({name: 'setting_id'})
    setting: Setting;

    @OneToOne(() => Security, (security) => security.user, {
        cascade: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })
    @JoinColumn({name: 'security_id'})
    security: Security;

    @Column('enum', {
        enum: Role,
        array: true,
        nullable: true,
        default: [Role.User]
    })
    roles?: Role[];

    @Column({default: false})
    suspended: boolean;

    @Column({default: false})
    deleted: boolean;

    @OneToMany(() => SupportedToken, (supportedToken) => supportedToken.user)
    supportedTokens: SupportedToken[]

    @OneToMany(() => PaymentRequest, (paymentRequest) => paymentRequest.user)
    paymentRequests: PaymentRequest[]

    @OneToMany(() => CallbackStatus, (callbackStatus) => callbackStatus.user)
    callbackStatus: CallbackStatus[]

    @Expose({
        name: 'full_name'
    })
    get fullName() {
        return `${this.firstName} ${this.lastName}`
    }

    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
}
