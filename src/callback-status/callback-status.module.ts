import { forwardRef, Module } from '@nestjs/common';
import { CallbackStatusService } from './callback-status.service';
import { CallbackStatusController } from './callback-status.controller';
import { DatabaseModule } from 'src/database/database.module';
import { callbackStatusProviders } from './callback-status.providers';
import { UtilsModule } from 'src/utils/utils.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => UtilsModule),
  ],
  providers: [
    ...callbackStatusProviders,
    CallbackStatusService,
  ],
  controllers: [CallbackStatusController],
  exports: [CallbackStatusService]
})
export class CallbackStatusModule {}
