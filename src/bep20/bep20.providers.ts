import { DataSource } from "typeorm";
import { Bep20 } from "./bep20.entity";

export const bep20Providers = [
    {
        provide: 'BEP20_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Bep20),
        inject: ['DATA_SOURCE'],  
    }
]