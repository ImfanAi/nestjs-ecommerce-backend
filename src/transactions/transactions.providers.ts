import { DataSource } from "typeorm";
import { Transaction } from "./entities/transaction.entity";

export const TransactionProviders = [
    {
        provide: 'TRANSACTION_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Transaction),
        inject: ['DATA_SOURCE']
    }
]