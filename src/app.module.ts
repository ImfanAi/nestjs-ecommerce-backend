import { CacheModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { Bep20Module } from './bep20/bep20.module';
import { TokensModule } from './tokens/token.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ListenerModule } from './listener/listener.module';
import { UtilsModule } from './utils/utils.module';
import { SettingsModule } from './settings/settings.module';
import { TransactionsModule } from './transactions/transactions.module';
import { TasksModule } from './tasks/tasks.module';
import { LogModule } from './clogs/log.module';
import { Trc20Module } from './trcListener/trc20.module';
import { SolModule } from './solListener/sol.module';
import { EthListenerModule } from './ethListener/ethListener.module';
import { MailModule } from './mail/mail.module';
import { AddressModule } from './address/address.module';
import { RequestModule } from './request/request.module';
import { Address } from './address/entity/address.entity';
import { BalanceModule } from './balance/balance.module';
import { SupportedTokenModule } from './supportedToken/supportedToken.module';
import { CallbackStatusModule } from './callback-status/callback-status.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BtcModule } from './btcListener/btc.module';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigModule } from '@nestjs/config';
import { PendingCollectModule } from './pending-collect/pending-collect.module';
import { UserRequestModule } from './user-request/user-request.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    Bep20Module,
    TokensModule,
    UsersModule,
    AuthModule,
    ListenerModule,
    UtilsModule,
    SettingsModule,
    TransactionsModule, TasksModule,
    LogModule,
    Trc20Module,
    SolModule,
    EthListenerModule,
    MailModule,
    AddressModule,
    RequestModule,
    BalanceModule,
    SupportedTokenModule,
    CallbackStatusModule,
    ScheduleModule.forRoot(),
    BtcModule,
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS,
      port: 6379
    }),
    PendingCollectModule,
    UserRequestModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService, Address],
})
export class AppModule {}
