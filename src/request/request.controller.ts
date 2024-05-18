import { BadRequestException, Body, Controller, Get, Headers, HttpException, Inject, Param, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AddressService } from 'src/address/address.service';
import { Address } from 'src/address/entity/address.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/role.decorator';
import { Role } from 'src/auth/role.enum';
import { SupportedTokenService } from 'src/supportedToken/supportedToken.service';
import { UtilsService } from 'src/utils/utils.service';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { RequestService } from './request.service';

@Controller('payment')
export class RequestController {
    constructor(
        private readonly requestService: RequestService,
        private readonly addressService: AddressService,
        private readonly utilsService: UtilsService,
        private readonly supTokenService: SupportedTokenService
    ) {

    }

    // general deposit request
    @Post('deposit')
    async getDepositAddress(@Headers() headers: any, @Body() body: any) {
        const setting = await this.utilsService.checkServerRequest(headers, body);
        let address: Address = null;
        try {
            const { network, coin, callback } = body;

            // check it is in supported token list
            const _supported = await this.supTokenService.checkToken(setting.user, network, coin);
            if(!_supported) {
                throw new BadRequestException({
                    status: 'failed',
                    error: true,
                    msg: 'This token is not supported',
                    address: null
                });
            }

            address = await this.addressService.getAvailableAddress(network);
            await this.addressService.updateAddressStatus(address.address, false);

            const createPaymentRequestDto: CreatePaymentRequestDto = {
                user: setting.user,
                network, coin, callback, address,
                depositType: 'deposit',
                createdAt: new Date()
            }
            await this.requestService.createPaymentRequest(createPaymentRequestDto);

            return {
                status: 'success',
                error: false,
                address: address.address
            }
        } catch (error) {
            console.log(error);
            if(address) {
                await this.addressService.updateAddressStatus(address.address, true);
            }
            throw new HttpException(error.response, error.status);
        }
    }

    // checkout request
    @Post('checkout')
    async getCheckoutAddress(@Headers() headers: any, @Body() body: any) {
        let address = null;
        try {
            const { user } = await this.utilsService.checkServerRequest(headers, body);
            const {network, coin, callback, checkoutAmount, product, unitPrice, quantity } = body;

            // check it is in supported token list
            const _supported = await this.supTokenService.checkToken(user, network, coin);
            if(!_supported) {
                throw new BadRequestException({
                    status: 'failed',
                    error: true,
                    msg: 'This token is not supported',
                    address: null
                });
            }

            address = await this.addressService.getAvailableAddress(network);
            await this.addressService.updateAddressStatus(address.address, false);

            const requestDto: CreatePaymentRequestDto = {
                user, network, coin, callback, address, depositType: 'checkout', checkoutAmount, product, unitPrice, quantity,
                createdAt: new Date()
            }
            await this.requestService.createPaymentRequest(requestDto);
            return {
                status: 'success',
                error: false,
                address: address.address
            }
        } catch (error) {
            if(address) {
                await this.addressService.updateAddressStatus(address.address, true);
            }
            throw new HttpException(error.response, error.status);
        }
    }

    // get payment logs by user
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getPaymentRequests(
        @Req() req,
        @Query('page') page: number = 1,
        @Query('take') take: number = 15
    ) {
        return await this.requestService.findAll(page, take, req.user.id);
    }

    // check payment request status
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getPaymentRequestById(
        @Req() req,
        @Param('id') id: number
    ) {
        const request = await this.requestService.getRequest(id);
        if(req.user.roles.includes(Role.Admin)) {
            return request;
        } else {
            if(request.user.id !== req.user.id) {
                throw new UnauthorizedException('You can see only your own payment request');
            }
            return request;
        }
    }

    // get payment log
    @Roles(Role.Admin)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get()
    async getPaymentRequestsByAdmin(
        @Query('page') page: number = 1,
        @Query('take') take: number = 15,
        @Query('user') userId: number
    ) {
        if(!userId) {
            throw new BadRequestException('User ID is required');
        }
        return await this.requestService.findAll(page, take, userId);
    }

}
