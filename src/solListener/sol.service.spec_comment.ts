// import { CacheModule, forwardRef } from '@nestjs/common';
// import { Test } from '@nestjs/testing';
// import * as redisStore from 'cache-manager-redis-store';
// import { AddressModule } from 'src/address/address.module';
// import { AddressService } from 'src/address/address.service';
// import { Address } from 'src/address/entity/address.entity';
// import { Bep20Module } from 'src/bep20/bep20.module';
// import { LogModule } from 'src/clogs/log.module';
// import { MissedBlockModule } from 'src/missing/missedBlock.module';
// import { RequestModule } from 'src/request/request.module';
// import { RequestService } from 'src/request/request.service';
// import { TokensModule } from 'src/tokens/token.module';
// import { TokenService } from 'src/tokens/token.service';
// import { TransactionsModule } from 'src/transactions/transactions.module';
// import { TransactionsService } from 'src/transactions/transactions.service';
// import { UtilsModule } from 'src/utils/utils.module';
// import { SolService } from './sol.service';

// describe('SOL Payment detector', () => {
//     let solService: SolService;
//     let tokenService: TokenService;
//     let addressService: AddressService;
//     let paymentService: RequestService;
//     let txnService: TransactionsService;

//     beforeEach(async () => {
//         const app = await Test.createTestingModule({
//             imports: [
//                 forwardRef(() => TokensModule),
//                 Bep20Module,
//                 UtilsModule,
//                 TransactionsModule,
//                 LogModule,
//                 MissedBlockModule,
//                 AddressModule,
//                 RequestModule,
//                 CacheModule.register({
//                     isGlobal: true,
//                     store: redisStore,
//                     host: process.env.REDIS,
//                     port: 6379
//                 }),
//             ],
//             providers: [SolService],
//             exports: [SolService]
//         }).compile();

//         solService = app.get<SolService>(SolService);
//         tokenService = app.get<TokenService>(TokenService);
//         addressService = app.get<AddressService>(AddressService);
//         paymentService = app.get<RequestService>(RequestService);
//         txnService = app.get<TransactionsService>(TransactionsService);

//         await solService.init();
//     })

//     /**
//      * Block: 160266999
//      * Destination: MAJ7epR484m7D515h9AwQNdfJ4TSGk4RmhrWH29iv47
//      * Signature: 3tz8UHRfCQ2VuJWCwKr9cvHmZaDmJrB35WNruK8ssXLxmtjNkmLSoQzoVxVkTxmLRStcKUHRpXs3oeorDmsUvbgo
//      * Amount: 0.32977777 SOL
//      */
//     // jest.setTimeout(20000);
//     it('Single SOL transfer', async () => {
//         const addressObj: Address = {
//             network: 'SOLANA',
//             address: 'MAJ7epR484m7D515h9AwQNdfJ4TSGk4RmhrWH29iv47',
//             activatedAt: new Date(),
//             available: true,
//             id: 1,
//             paymentRequests: [{
//                 id: 1,
//                 callback: 'http://callback',
//                 coin: 'SOL',
//                 createdAt: new Date(),
//                 depositType: 'Deposit',
//                 network: 'SOLANA',
//                 received: 100,
//                 status: 'pending',
//                 transactions: [],
//                 updatedAt: new Date(),
//                 user: null,
//                 address: null,
//             }],
//             privateKey: 'dummy private key'
//         }

//         const solToken = {
//             id: 13, // random
//             syncBlock: '160266999'
//         }

//         jest.spyOn(addressService, 'checkAddress').mockImplementation(async () => addressObj);
//         jest.spyOn(txnService, 'create').mockImplementation(async () => null);
//         jest.spyOn(paymentService, 'updatePaymentStatus').mockImplementation(async () => null);
//         jest.spyOn(tokenService, 'updateTokenSyncByNetwork').mockImplementation(async () => null);
//         jest.spyOn(tokenService, 'findOne').mockImplementation(async () => solToken);

//         // const founds = await solService.runSync();
//         // console.log(founds);
//         // expect(founds);
//     });
// });
