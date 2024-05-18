import { DataSource } from "typeorm";
import { Security } from "./entities/security.entity";
import { Setting } from "./entities/setting.entity";

export const SettingsProviders = [
    {
        provide: 'SETTING_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Setting),
        inject: ['DATA_SOURCE']
    },
    {
        provide: 'SECURITY_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Security),
        inject: ['DATA_SOURCE']
    }
]
