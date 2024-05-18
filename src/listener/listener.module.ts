import { forwardRef, Module } from '@nestjs/common';
import { Bep20Module } from 'src/bep20/bep20.module';
import { LogModule } from 'src/clogs/log.module';
import { SettingsModule } from 'src/settings/settings.module';
import { TokensModule } from 'src/tokens/token.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { UtilsModule } from 'src/utils/utils.module';
import { EthCacheService } from '../baseListener/cache.service';
import { ListenerService } from './listener.service';
import { NetListenerService } from '../baseListener/net.listener.service';
import { PegListenerService } from 'src/baseListener/peg.listener.service';
import { AddressModule } from 'src/address/address.module';
import { RequestModule } from 'src/request/request.module';

@Module({
  imports: [
    Bep20Module,
    forwardRef(() => TokensModule),
    SettingsModule, AddressModule,
    forwardRef(() => RequestModule),
    TransactionsModule, LogModule,
    UtilsModule,
  ],
  providers: [ListenerService, PegListenerService, EthCacheService, NetListenerService],
  exports: [ListenerService]
})
export class ListenerModule {}
