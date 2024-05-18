import { DataSource } from "typeorm";

require('dotenv').config();

export const databaseProvider = [
    {
        provide: 'DATA_SOURCE',
        useFactory: async () => {
            const dataSource = new DataSource({
                type: 'postgres',
                host: process.env.POSTGRES_HOST,
                port: Number(process.env.POSTGRES_PORT),
                username: process.env.POSTGRES_USER,
                password: process.env.POSTGRES_PASSWORD,
                database: process.env.POSTGRES_DATABASE,
                entities: [
                    __dirname + '../../**/*.entity.{js,ts}',
                ],
                synchronize: true,
            });
            return dataSource.initialize();
        }
    }
]
