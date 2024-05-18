import { Module } from '@nestjs/common';
import { UserRequestService } from './user-request.service';
import { UserRequestController } from './user-request.controller';
import { DatabaseModule } from 'src/database/database.module';
import { UsersModule } from 'src/users/users.module';
import { SettingsModule } from 'src/settings/settings.module';
import { MailModule } from 'src/mail/mail.module';
import { userRequestProviders } from './user-request.providers';

@Module({
  imports: [DatabaseModule, UsersModule, SettingsModule, MailModule],
  controllers: [UserRequestController],
  providers: [
    ...userRequestProviders,
    UserRequestService
  ],
  exports: [UserRequestService]
})
export class UserRequestModule {}
