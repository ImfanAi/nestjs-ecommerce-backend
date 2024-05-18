import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { UsersModule } from 'src/users/users.module';
import { BalanceController } from './balance.controller';
import { BalanceProviders } from './balance.providers';
import { BalanceService } from './balance.service';

@Module({
    imports: [
        DatabaseModule,
        UsersModule
    ],
    controllers: [BalanceController],
    providers: [
        ...BalanceProviders,
        BalanceService
    ],
    exports: [BalanceService]
})
export class BalanceModule {}
