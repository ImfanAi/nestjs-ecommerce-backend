import { DataSource } from "typeorm";
import { Balance } from "./entities/balance.entity";

export const BalanceProviders = [
    {
        provide: 'BALANCE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Balance),
        inject: ['DATA_SOURCE'],
    }
]
