import { User } from "src/users/entities/user.entity";
import { Entity, PrimaryGeneratedColumn } from "typeorm";
import { Column } from "typeorm/decorator/columns/Column";
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn";
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne";

export enum REQUEST_TYPE {
    TFA_RESET = 'TFA_RESET',
}

@Entity('userrequests') 
export class UserRequest {
    @PrimaryGeneratedColumn()
    id: number;

    // who
    @ManyToOne(() => User, {
        cascade: false
    })
    @JoinColumn()
    user: User;
    
    // when
    @Column({type: 'timestamp'})
    requestedAt: Date;
    
    // what
    @Column('text')
    requestType: REQUEST_TYPE;
    
    // Actioner!!
    @ManyToOne(() => User, {
        cascade: false,
        nullable: true
    })
    @JoinColumn()
    admin: User;

    // status, 0 - pending, 1 - done, 2 - denied
    @Column({default: 0})
    status: number;

    @Column({nullable: true})
    reason: string;
    
    @Column({type: 'timestamp', nullable: true})
    updatedAt: Date
}