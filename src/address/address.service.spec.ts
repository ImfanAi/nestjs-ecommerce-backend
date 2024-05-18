import { Test } from "@nestjs/testing"
import axios from "axios";
import { DatabaseModule } from "src/database/database.module";
import { AddressController } from "./address.controller";
import { AddressProviders } from "./address.providers";
import { AddressService } from "./address.service";
import * as solanaWeb3 from '@solana/web3.js';
import { BadRequestException } from "@nestjs/common";
import { BSC_NETWORK, BTC_NETWORK, SOL_NETWORK, TRC_NETWORK } from "src/constants";

function hexToBytes(hex: string): Uint8Array {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return Uint8Array.from(bytes);
}

describe('Address service', () => {
    let addressService: AddressService;

    beforeEach(async () => {
        const app = await Test.createTestingModule({
            imports: [
                DatabaseModule],
            providers: [
                ...AddressProviders,
                AddressService
            ],
            controllers: [AddressController],
            exports: [AddressService]
        }).compile();

        addressService = app.get<AddressService>(AddressService);
    })

    describe('Generate wallet & Get Balance', () => {
        it(BSC_NETWORK, async () => {
            const bep20Address = await addressService.generateNewWallet(BSC_NETWORK);

            expect(bep20Address).toBeDefined();

            // validating private key/address
            expect(addressService
                .bepNetwork
                .eth.accounts
                .privateKeyToAccount(bep20Address.privateKey)
                .address)
                    .toBe(bep20Address.address);
            expect(await addressService
                .getBalance(BSC_NETWORK, bep20Address.address)).toBe(0);
        });

        it(TRC_NETWORK, async () => {
            const tronAddr = await addressService.generateNewWallet(TRC_NETWORK);
            expect(tronAddr).toBeDefined();

            // validating private key/address pair
            expect(addressService.trcNetwork.address.fromPrivateKey(tronAddr.privateKey)).toBe(tronAddr.address);
            expect(await addressService
                .getBalance(TRC_NETWORK, tronAddr.address)).toBe(0);
        });

        it(BTC_NETWORK, async () => {
            const btcAddr = await addressService.generateNewWallet(BTC_NETWORK);
            expect(btcAddr).toBeDefined();

            const balanceData = {
                'final_balance': 0,
                'n_tx': 0,
                'total_received': 0
            }
            const btcBalanceAPI = `https://blockchain.info/balance?active=${btcAddr.address}`;
            const response = await axios.get(btcBalanceAPI);
            expect(response.data[btcAddr.address]).toStrictEqual(balanceData);
            expect(await addressService.getBalance(BTC_NETWORK, btcAddr.address)).toBe(0);
        });

        it(SOL_NETWORK, async () => {
            const solAddr = await addressService.generateNewWallet(SOL_NETWORK);
            const byteSecret = hexToBytes(solAddr.privateKey);
            const solana = solanaWeb3.Keypair.fromSecretKey(byteSecret).publicKey.toBase58();
            expect(solana).toBe(solAddr.address);
            expect(await addressService.getBalance(SOL_NETWORK, solAddr.address)).toBe(0);
        });

        it('NOT', async () => {
            try {
                await addressService.generateNewWallet('NOT');
            } catch (error) {
                expect(error).toStrictEqual(new BadRequestException({
                    status: 'failed',
                    error: true,
                    msg: 'This network is not supported',
                    address: null
                }))
            }
        })
    });

    describe('Get available address', () => {
        it('available address with valid network', async () => {
            const address = await addressService.getAvailableAddress(BTC_NETWORK);
            expect(address).toBeDefined();
        });

        it('with invalid network', async () => {
            try {
                await addressService.getAvailableAddress('NOT');
            } catch (error) {
                expect(error).toStrictEqual(new BadRequestException({
                    status: 'failed',
                    error: true,
                    msg: 'This network is not supported',
                    address: null
                }))
            }
        })

    })
})
