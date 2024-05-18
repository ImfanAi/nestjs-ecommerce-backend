import { DataSource } from "typeorm";
import { SupportedToken } from "./entity/supportedToken.entity";

export const SupportedTokenProviders = [
    {
        provide: 'SUPPORTEDTOKEN_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(SupportedToken),
        inject: ['DATA_SOURCE']
    }
]
