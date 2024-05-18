import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { UtilsModule } from 'src/utils/utils.module';
import { Bep20Controller } from './bep20.controller';
import { bep20Providers } from './bep20.providers';
import { Bep20Service } from './bep20.service';

@Module({
    imports: [DatabaseModule, UtilsModule],
    providers: [
        ...bep20Providers,
        Bep20Service
    ],
    controllers: [Bep20Controller],
    exports: [Bep20Service]
})
export class Bep20Module {}
