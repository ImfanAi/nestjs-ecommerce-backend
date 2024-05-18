import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { AddressController } from './address.controller';
import { AddressProviders } from './address.providers';
import { AddressService } from './address.service';

@Module({
    imports: [DatabaseModule],
    providers: [
        ...AddressProviders,
        AddressService
    ],
    controllers: [AddressController],
    exports: [AddressService]
})
export class AddressModule {}
