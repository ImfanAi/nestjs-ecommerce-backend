import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AddressService } from 'src/address/address.service';
import { BalanceService } from 'src/balance/balance.service';
import { CallbackBody } from 'src/baseListener/callback.body';
import { SettingsService } from 'src/settings/settings.service';
import { TokenService } from 'src/tokens/token.service';
import { UsersService } from 'src/users/users.service';
import { UtilsService } from 'src/utils/utils.service';
import { LessThan, Repository } from 'typeorm';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { PaymentRequest } from './entities/paymentRequest.entity';

@Injectable()
export class RequestService {
    constructor(
        @Inject('PAYMENTREQUEST_REPOSITORY')
        private readonly paymentRequestRepo: Repository<PaymentRequest>,
        private readonly addressService: AddressService,
        private readonly utilsService: UtilsService,
        private readonly userService: UsersService,
        private readonly balanceService: BalanceService,
        private readonly tokenService: TokenService
    ) {}

    expireTime: number = 8; // hours

    // create new checkout request
    async createPaymentRequest (request: CreatePaymentRequestDto) {
        return await this.paymentRequestRepo.save(request);
    }

    async updatePaymentStatus(id: number, received: number) {
        try {
            const paymentRequest = await this.paymentRequestRepo.findOne({where: {id}, relations: {user: true, address: true}});
            const { setting } = await this.userService.findOne({id: paymentRequest.user.id});
            if(paymentRequest.depositType === 'deposit') {
                await this.paymentRequestRepo.update({id}, {
                    received,
                    status: 'processed'
                });

                //release address
                await this.addressService.updateAddressStatus(paymentRequest.address.address, true);

                // send callback
                const callbackBody: CallbackBody = {
                    depositType: 'deposit',
                    network: paymentRequest.network,
                    coin: paymentRequest.coin,
                    received,
                    status: 2,
                }
                await this.utilsService.sendCallback(setting, callbackBody, paymentRequest.callback);

            } else if(paymentRequest.depositType === 'checkout') {
                if(paymentRequest.checkoutAmount < paymentRequest.received + received) {
                    // checkout finished
                    await this.paymentRequestRepo.update({id}, {
                        received: paymentRequest.received + received,
                        status: 'processed'
                    });
                    await this.addressService.updateAddressStatus(paymentRequest.address.address, true);

                    // send callback
                    const callbackBody: CallbackBody = {
                        depositType: 'checkout',
                        network: paymentRequest.network,
                        coin: paymentRequest.coin,
                        received: paymentRequest.received + received,
                        status: 2,
                    }
                    await this.utilsService.sendCallback(setting, callbackBody, paymentRequest.callback);

                } else {
                    // not yet finished
                    await this.paymentRequestRepo.update({id}, {
                        received: paymentRequest.received + received,
                    });

                    // send callabck
                    const callbackBody: CallbackBody = {
                        depositType: 'checkout',
                        network: paymentRequest.network,
                        coin: paymentRequest.coin,
                        received: paymentRequest.received + received,
                        status: 1,
                    }
                    await this.utilsService.sendCallback(setting, callbackBody, paymentRequest.callback);
                }
            } else {
                throw new BadRequestException({msg: 'There is no matched deposit type'});
            }

            // update user balance
            const token = await this.tokenService.findOne({network: paymentRequest.network, name: paymentRequest.coin});
            await this.balanceService.addBalance(paymentRequest.user, token, received);
        } catch (error) {
            console.log(error);
        }
    }

    // check requests
    async getRequest(id: number) {
        return await this.paymentRequestRepo.findOne(
            {where: {id}, relations: {user: true}}
        );
    }

    async expireFlag(hours?: number) {
        const expire = hours || this.expireTime;
        const expireMil = expire * 1000 * 3600;
        const expiredAt = new Date(Date.now() - expireMil);
        await this.paymentRequestRepo.update({createdAt: LessThan(expiredAt)}, {status: 'expired'});
    }

    // get expired requests
    async getExpired(hours?: number) {
        const expire = hours || this.expireTime;
        const expireMil = expire * 1000 * 3600;
        const expiredAt = new Date(Date.now() - expireMil);
        return await this.paymentRequestRepo
            .find({where: {
                createdAt: LessThan(expiredAt),
                status: 'pending'
            }, relations: {address: true}})
    }

    // fetch request history
    async findAll(page: number, take: number, userId: number) {
        const [requests, total] = await this.paymentRequestRepo.createQueryBuilder('payment_request')
            .where('payment_request.user_id = :userId', {userId})
            .take(take)
            .skip((page - 1) * take)
            .getManyAndCount();
        return {
            data: requests,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / take)
            }
        }
    }
}
