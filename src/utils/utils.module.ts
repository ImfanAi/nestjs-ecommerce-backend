import { forwardRef, Module } from '@nestjs/common';
import { CallbackStatusModule } from 'src/callback-status/callback-status.module';
import { SettingsModule } from 'src/settings/settings.module';
import { UtilsService } from './utils.service';

@Module({
  imports: [SettingsModule, 
    forwardRef(() => CallbackStatusModule),
  ],
  providers: [UtilsService],
  exports: [UtilsService]
})
export class UtilsModule {}
