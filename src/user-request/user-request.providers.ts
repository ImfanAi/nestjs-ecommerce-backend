import { DataSource } from "typeorm";
import { UserRequest } from "./entities/user-request.entity";

export const userRequestProviders = [
    {
        provide: 'USERREQUEST_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(UserRequest),
        inject: ['DATA_SOURCE']
    }
]