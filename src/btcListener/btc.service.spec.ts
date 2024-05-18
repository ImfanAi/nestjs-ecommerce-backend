import { Test } from "@nestjs/testing";
import { BtcService } from "./btc.service"
import * as redisStore from 'cache-manager-redis-store';
import { forwardRef, CacheModule } from "@nestjs/common";
import { AddressModule } from "src/address/address.module";
import { AddressService } from "src/address/address.service";
import { Bep20Module } from "src/bep20/bep20.module";
import { LogModule } from "src/clogs/log.module";
import { RequestModule } from "src/request/request.module";
import { RequestService } from "src/request/request.service";
import { TokensModule } from "src/tokens/token.module";
import { TokenService } from "src/tokens/token.service";
import { TransactionsModule } from "src/transactions/transactions.module";
import { TransactionsService } from "src/transactions/transactions.service";
import { UtilsModule } from "src/utils/utils.module";
import { Address } from "src/address/entity/address.entity";

describe('BTC payment detector', () => {
    let btcService: BtcService;
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
            providers: [BtcService],
            exports: [BtcService]
        }).compile();

        tokenService = app.get<TokenService>(TokenService);
        addressService = app.get<AddressService>(AddressService);
        paymentService = app.get<RequestService>(RequestService);
        txnService = app.get<TransactionsService>(TransactionsService);
        btcService = app.get<BtcService>(BtcService);
    })

    /**
     * Block: 762368
     * Hash: 5db2cb94deef5bfaa154b89a1ba1b59c966828c5250166d7696b896dc20699c5
     * Address: bc1qq2x0vx5dhm48gyyrym9z2f9qqz0fwpt56637la
     * Amount: 8.82737491 BTC
     *  */
    jest.setTimeout(10000);
    it('BTC Transaction listener', async () => {
        const addressObj: Address = {
            network: 'BTC',
            address: 'bc1qq2x0vx5dhm48gyyrym9z2f9qqz0fwpt56637la',
            activatedAt: new Date(),
            available: true,
            id: 1,
            paymentRequests: [{
                id: 1,
                callback: 'http://callback',
                coin: 'BTC',
                createdAt: new Date(),
                depositType: 'Deposit',
                network: 'BTC',
                received: 100,
                status: 'pending',
                transactions: [],
                updatedAt: new Date(),
                user: null,
                address: null,
            }],
            privateKey: 'dummy private key'
        }

        const btcToken = {
            id: 13, // random
            syncBlock: '762367'
        }

        jest.spyOn(addressService, 'checkAddress').mockImplementation(async () => addressObj);
        jest.spyOn(txnService, 'create').mockImplementation(async () => null);
        jest.spyOn(paymentService, 'updatePaymentStatus').mockImplementation(async () => null);
        jest.spyOn(tokenService, 'updateTokenSyncByNetwork').mockImplementation(async () => null);
        jest.spyOn(tokenService, 'findOne').mockImplementation(async () => btcToken);

        const founds = await btcService.runSync();
        expect(founds.length).toBeGreaterThan(0);
        const txn = founds[0];
        expect(txn.amount).toBe('882737491');
        expect(txn.request).toStrictEqual(addressObj.paymentRequests[0]);
        expect(txn.txnHash).toBe('5db2cb94deef5bfaa154b89a1ba1b59c966828c5250166d7696b896dc20699c5')
    })
})
