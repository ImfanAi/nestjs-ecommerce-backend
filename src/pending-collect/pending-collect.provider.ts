import { DataSource } from "typeorm";
import { PendingCollect } from "./entities/pending-collect.entity";

export const pendingCollectProviders = [
    {
        provide: 'PENDINGCOLLECT_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(PendingCollect),
        inject: ['DATA_SOURCE']
    }
]