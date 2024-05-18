import { CacheModule, forwardRef } from "@nestjs/common";
import { Test } from "@nestjs/testing"
import { AddressModule } from "src/address/address.module";
import { AddressService } from "src/address/address.service";
import { BalanceModule } from "src/balance/balance.module";
import { BSC_NETWORK } from "src/constants";
import { DatabaseModule } from "src/database/database.module";
import { Setting } from "src/settings/entities/setting.entity";
import { SupportedToken } from "src/supportedToken/entity/supportedToken.entity";
import { SupportedTokenModule } from "src/supportedToken/supportedToken.module";
import { SupportedTokenService } from "src/supportedToken/supportedToken.service";
import { TokensModule } from "src/tokens/token.module";
import { UsersModule } from "src/users/users.module";
import { UtilsModule } from "src/utils/utils.module";
import { UtilsService } from "src/utils/utils.service";
import { RequestController } from "./request.controller";
import { RequestProviders } from "./request.providers";
import { RequestService } from "./request.service";
import * as redisStore from 'cache-manager-redis-store';

describe('Request controller', () => {
    let requestController: RequestController;
    let requestService: RequestService;
    let utilsService: UtilsService;
    let supTokenService: SupportedTokenService;
    let addressService: AddressService;

    beforeEach(async () => {
        const app = await Test.createTestingModule({
            imports: [
                DatabaseModule,
                AddressModule,
                UtilsModule,
                UsersModule,
                forwardRef(() => SupportedTokenModule),
                forwardRef(() => TokensModule),
                BalanceModule,
                CacheModule.register({
                    isGlobal: true,
                    store: redisStore,
                    host: process.env.REDIS,
                    port: 6379
                }),
            ],
            providers: [
                ...RequestProviders,
                RequestService],
            controllers: [RequestController],
            exports: [RequestService]
        }).compile();

        requestController = app.get<RequestController>(RequestController);
        requestService = app.get<RequestService>(RequestService);
        utilsService = app.get<UtilsService>(UtilsService);
        supTokenService = app.get<SupportedTokenService>(SupportedTokenService);
        addressService = app.get<AddressService>(AddressService);
    })

    it('Get deposit address', async () => {
        const setting = {user: {
            name: 'test user'
        }}

        const supported = {
            flag: true
        }
        jest.spyOn(utilsService, 'checkServerRequest')
            .mockImplementation(async () => setting as unknown as Setting);
        jest.spyOn(supTokenService, 'checkToken')
            .mockImplementation(async () => supported as unknown as SupportedToken);
        jest.spyOn(requestService, 'createPaymentRequest').mockImplementation(async () => null);

        const addressObj = await requestController.getDepositAddress(null, {
            network: BSC_NETWORK,
            coin: 'USDT',
            callback: 'Test callback'
        });

        expect(addressObj.status).toBe('success');
        const updatedAddress = await addressService.getAddress(addressObj.address);
        expect(updatedAddress.available).toBe(false);
    });

    it('Get checkout address', async () => {
        const setting = {user: {
            name: 'test user'
        }}

        const supported = {
            flag: true
        }
        jest.spyOn(utilsService, 'checkServerRequest')
            .mockImplementation(async () => setting as unknown as Setting);
        jest.spyOn(supTokenService, 'checkToken')
            .mockImplementation(async () => supported as unknown as SupportedToken);
        jest.spyOn(requestService, 'createPaymentRequest').mockImplementation(async () => null);

        const addressObj = await requestController.getCheckoutAddress(null, {
            network: BSC_NETWORK,
            coin: 'USDT',
            callback: 'Test callback'
        });

        expect(addressObj.status).toBe('success');
        const updatedAddress = await addressService.getAddress(addressObj.address);
        expect(updatedAddress.available).toBe(false);

    })
})
