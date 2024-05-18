import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { RequestProviders } from './request.providers';
import { RequestService } from './request.service';
import { RequestController } from './request.controller';
import { AddressModule } from 'src/address/address.module';
import { UtilsModule } from 'src/utils/utils.module';
import { SupportedTokenModule } from 'src/supportedToken/supportedToken.module';
import { TokensModule } from 'src/tokens/token.module';
import { BalanceModule } from 'src/balance/balance.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    DatabaseModule,
    AddressModule,
    UtilsModule,
    UsersModule,
    forwardRef(() => SupportedTokenModule),
    forwardRef(() => TokensModule),
    BalanceModule
  ],
  providers: [
    ...RequestProviders,
    RequestService],
  controllers: [RequestController],
  exports: [RequestService]
})
export class RequestModule {}
