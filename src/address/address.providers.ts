import { DataSource } from "typeorm";
import { Address } from "./entity/address.entity";

export const AddressProviders = [
    {
        provide: 'ADDRESS_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Address),
        inject: ['DATA_SOURCE']
    }
]
