import { DataSource } from "typeorm";
import { Collector } from "./entities/collector.entity";

export const collectorProviders = [
    {
        provide: 'COLLECTOR_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Collector),
        inject: ['DATA_SOURCE']
    }
]