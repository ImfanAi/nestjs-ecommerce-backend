import { Module } from '@nestjs/common';
import { AddressModule } from 'src/address/address.module';
import { DatabaseModule } from 'src/database/database.module';
import { TokensModule } from 'src/tokens/token.module';
import { pendingCollectProviders } from './pending-collect.provider';
import { PendingCollectService } from './pending-collect.service';

@Module({
  imports: [DatabaseModule, AddressModule, TokensModule],
  providers: [
    ...pendingCollectProviders,
    PendingCollectService
  ],
  exports: [PendingCollectService]
})
export class PendingCollectModule {}
