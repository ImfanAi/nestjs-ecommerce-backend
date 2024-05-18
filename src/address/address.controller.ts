import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AddressService } from './address.service';

@Controller('address')
export class AddressController {
    constructor(
        private readonly addressService: AddressService
    ) {
    }

    @Get('check')
    async checkAddress(@Body() body: any) {
        const matched = await this.addressService.checkAddress(body.address);
        return matched
    }

    @Get(':address')
    async getAddress(@Param('address') address: string) {
        const addressObj = await this.addressService.getAddress(address);
        return {
            status: "success",
            address: addressObj
        }
    }
}

