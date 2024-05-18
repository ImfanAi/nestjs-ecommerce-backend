import { DataSource } from "typeorm";
import { CallbackStatus } from "./entities/callback-status.entity";

export const callbackStatusProviders = [
    {
        provide: 'CALLBACKSTATUS_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(CallbackStatus),
        inject: ['DATA_SOURCE']
    }
]
