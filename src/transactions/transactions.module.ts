import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TransactionProviders } from './transactions.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [TransactionsController],
  providers: [
    ...TransactionProviders,
    TransactionsService
  ],
  exports: [TransactionsService]
})
export class TransactionsModule {}
