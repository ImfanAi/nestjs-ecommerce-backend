import { Module } from '@nestjs/common';
import { AddressModule } from 'src/address/address.module';
import { BalanceModule } from 'src/balance/balance.module';
import { RequestModule } from 'src/request/request.module';
import { SettingsModule } from 'src/settings/settings.module';
import { SupportedTokenModule } from 'src/supportedToken/supportedToken.module';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    SettingsModule,
    SupportedTokenModule,
    BalanceModule,
    AddressModule,
    RequestModule
  ],
  providers: [TasksService]
})
export class TasksModule {}
