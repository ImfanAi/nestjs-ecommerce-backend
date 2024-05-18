import { DataSource } from "typeorm";
import { MissedBlock } from "./missedBlock.entity";

export const MissedBlockProviders = [
    {
        provide: 'MISSEDBLOCK_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(MissedBlock),
        inject: ['DATA_SOURCE']
    }
]
