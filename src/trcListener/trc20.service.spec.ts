/**
 * token: tron token
 * request: addressObj.paymentRequests[0]
 * txnHash: txn.txID
 * amount: received amount
 * logId: txn id
 * createdAt: new Date() => could be ignore
 */

import { CacheModule, forwardRef } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AddressModule } from "src/address/address.module";
import { AddressService } from "src/address/address.service";
import { Address } from "src/address/entity/address.entity";
import { Bep20Module } from "src/bep20/bep20.module";
import { LogModule } from "src/clogs/log.module";
import { RequestModule } from "src/request/request.module";
import { RequestService } from "src/request/request.service";
import { Token } from "src/tokens/token.entity";
import { TokensModule } from "src/tokens/token.module";
import { TokenService } from "src/tokens/token.service";
import { TransactionsModule } from "src/transactions/transactions.module";
import { TransactionsService } from "src/transactions/transactions.service";
import { UtilsModule } from "src/utils/utils.module";
import { Trc20Service } from "./trc20.service"
import * as redisStore from 'cache-manager-redis-store';

describe('USDT(TRC20) Payment detector', () => {
    let trc20Service: Trc20Service;
    let tokenService: TokenService;
    let addressService: AddressService;
    let paymentService: RequestService;
    let txnService: TransactionsService;

    beforeEach(async () => {
        const app = await Test.createTestingModule({
            imports: [
                forwardRef(() => TokensModule),
                Bep20Module,
                TransactionsModule,
                LogModule,
                UtilsModule,
                AddressModule,
                RequestModule,
                CacheModule.register({
                    isGlobal: true,
                    store: redisStore,
                    host: process.env.REDIS,
                    port: 6379
                }),
            ],
            providers: [Trc20Service],
            exports: [Trc20Service]
        }).compile();

        trc20Service = app.get<Trc20Service>(Trc20Service);
        tokenService = app.get<TokenService>(TokenService);
        addressService = app.get<AddressService>(AddressService);
        paymentService = app.get<RequestService>(RequestService);
        txnService = app.get<TransactionsService>(TransactionsService);

        await trc20Service.init();
    });

    /**
     * sample case one USDT transfer
     *
     * block: 43243875
     * address: TS7NjiuPXDrNJbVrujDyXbmkbysBtCufVV
     * hash: 5f23b35895263ba305e3048c7952741620d15fe1f7c2e8c6fceb3ad216238f91
     * amount: 2000000000
     */
    jest.setTimeout(10000);
    it('Transfer case', async () => {
        const addressObj: Address = {
            network: 'TRON',
            address: 'TS7NjiuPXDrNJbVrujDyXbmkbysBtCufVV',
            activatedAt: new Date(),
            available: true,
            id: 1,
            paymentRequests: [{
                id: 1,
                callback: 'http://callback',
                coin: 'USDT',
                createdAt: new Date(),
                depositType: 'Deposit',
                network: 'TRON',
                received: 100,
                status: 'pending',
                transactions: [],
                updatedAt: new Date(),
                user: null,
                address: null,
            }],
            privateKey: 'dummy private key'
        }

        jest.spyOn(addressService, 'checkAddress').mockImplementation(async () => addressObj);
        jest.spyOn(txnService, 'create').mockImplementation(async () => null);
        jest.spyOn(paymentService, 'updatePaymentStatus').mockImplementation(async () => null);
        jest.spyOn(tokenService, 'updateTokenSyncByNetwork').mockImplementation(async () => null);

        // set latest blocknumber
        trc20Service.latestBlkNumber = 43243880;

        // set block number to 43243874
        const usdtToken: Token = await tokenService.findOne({network: 'TRON', name: 'USDT'});
        await tokenService.updateTokenSync(usdtToken.id, '43243874');

        const founds = await trc20Service.runSync();
        expect(founds.length).toBeGreaterThan(0);
        expect(founds[0].request).toStrictEqual(addressObj.paymentRequests[0]);
        expect(Number(founds[0].amount)).toBe(2000000000);
        expect(founds[0].txnHash).toBe('5f23b35895263ba305e3048c7952741620d15fe1f7c2e8c6fceb3ad216238f91');
    });

    /**
     * sample case USDT transferFrom
     *
     * block: 43243875
     * address: TWicW81qY65EjEYVyir2pqbXfSpXQWX9EJ
     * hash: 62a9ab97eb6bf7ed7023f6856ef4e7eca711b4a41b7b9de36b042c94099bdebb
     * amount: 38970000
     */
     jest.setTimeout(20000);
    it('TransferFrom case', async () => {
        const addressObj: Address = {
            network: 'TRON',
            address: 'TWicW81qY65EjEYVyir2pqbXfSpXQWX9EJ',
            activatedAt: new Date(),
            available: true,
            id: 1,
            paymentRequests: [{
                id: 1,
                callback: 'http://callback',
                coin: 'USDT',
                createdAt: new Date(),
                depositType: 'Deposit',
                network: 'TRON',
                received: 100,
                status: 'pending',
                transactions: [],
                updatedAt: new Date(),
                user: null,
                address: null,
            }],
            privateKey: 'dummy private key'
        }

        jest.spyOn(addressService, 'checkAddress').mockImplementation(async () => addressObj);
        jest.spyOn(txnService, 'create').mockImplementation(async () => null);
        jest.spyOn(paymentService, 'updatePaymentStatus').mockImplementation(async () => null);
        jest.spyOn(tokenService, 'updateTokenSyncByNetwork').mockImplementation(async () => null);

        // set latest blocknumber
        trc20Service.latestBlkNumber = 43243880;

        // set block number to 43243874
        const usdtToken: Token = await tokenService.findOne({network: 'TRON', name: 'USDT'});
        await tokenService.updateTokenSync(usdtToken.id, '43243874');

        const founds = await trc20Service.runSync();
        expect(founds.length).toBe(1);
        expect(founds[0].request).toStrictEqual(addressObj.paymentRequests[0]);
        expect(Number(founds[0].amount)).toBe(38970000);
        expect(founds[0].txnHash).toBe('62a9ab97eb6bf7ed7023f6856ef4e7eca711b4a41b7b9de36b042c94099bdebb');

    })
})
