import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserProviders } from './users.providers';
import { DatabaseModule } from 'src/database/database.module';
import { SettingsModule } from 'src/settings/settings.module';
import { MailModule } from 'src/mail/mail.module';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [DatabaseModule, SettingsModule, MailModule, UtilsModule],
  controllers: [UsersController],
  providers: [
    ...UserProviders,
    UsersService
  ],
  exports: [UsersService]
})
export class UsersModule {}
