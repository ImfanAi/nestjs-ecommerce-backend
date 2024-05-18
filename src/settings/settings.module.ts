import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SettingsProviders } from './settings.providers';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SettingsController],
  providers: [
    ...SettingsProviders,
    SettingsService
  ],
  exports: [SettingsService]
})
export class SettingsModule {}
