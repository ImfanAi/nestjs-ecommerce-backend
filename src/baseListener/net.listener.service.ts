import { Injectable } from "@nestjs/common";
import Web3 from 'web3';
import { Token } from "src/tokens/token.entity";
import { TokenService } from "src/tokens/token.service";
import ReceiverService from "./receiver.interface";
import { EthCacheService } from "./cache.service";
import { AddressService } from "src/address/address.service";

@Injectable()
export class NetListenerService {

    constructor(
        private readonly tokenService: TokenService,
        private readonly cacheService: EthCacheService,
        private readonly addressService: AddressService
    ) {}

    web3: Web3 = null;
    network: string = '';
    isRunning: boolean = false;
    runInterval: number = 15000;
    handle: ReturnType<typeof setTimeout> = undefined

    token: Token | undefined = undefined;
    receiverService: ReceiverService = null;

    async runSync() {

        let currentBlkNum = 0;
        try {
            currentBlkNum = await this.web3.eth.getBlockNumber();
            console.log(`current ${this.network} block number: ${currentBlkNum}`, );
        } catch (error) {
            console.log(this.network);
            console.log("Error from getting block number in net listener\n", error);
            this.reschedule(this.runInterval);
            return;
        }
        this.token = await this.tokenService.findOne({network: this.network, name: this.token.name});
        const leftBlocks = currentBlkNum - (+this.token.syncBlock);

        if(leftBlocks < 20) {
            this.reschedule(this.runInterval);
            return;
        }

        if(leftBlocks > 100) {
            currentBlkNum = (+this.token.syncBlock) + 100;
        }

        for (let blockNumber = +this.token.syncBlock; blockNumber < currentBlkNum; blockNumber++) {
            try {
                const txns = await this.web3.eth.getBlock(blockNumber, true);
                console.log(txns.transactions[0]);
                txns.transactions.forEach(async (txn) => {
                    try {
                        if(txn.value !== '0' && txn.to !== null) {

                            // checking address!
                            const addressObj = await this.addressService.checkAddress(txn.to);

                            if(addressObj === null) return;

                            console.log(`---- found ${this.token.name} deposit ------`)
                            console.log(addressObj);

                            this.cacheService.txns.insertInBegin({
                                id: 1,
                                address: txn.to,
                                blockNumber: txn.blockNumber,
                                txnHash: txn.hash,
                                amount: txn.value,
                                addressObj
                            });
                        }
                    } catch (error) {
                        console.log(error);
                        return;
                    }
                })
                await this.tokenService.updateTokenSync(this.token.id, blockNumber.toString());
                await new Promise(r => setTimeout(r, 100));
            } catch (error) {
                console.log(this.network);
                console.log("Error from getting block in net listener\n", error);
                continue;
            }
        }
        this.reschedule(this.runInterval);
    }

    async reschedule(delay?: number) {
        if(this.handle) {
            clearTimeout(this.handle);
        }

        const nextRun = delay || this.runInterval;
        this.handle = setTimeout(async () => {
            await this.runSync();
        }, nextRun);
    }

    async init(
        network: string,
        rpcUrl: string,
        token: Token,
        receiverService: ReceiverService,
    ) {
        this.network = network;
        this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
        this.token = token;
        this.receiverService = receiverService;

        this.cacheService.init(network, rpcUrl, token);
        await this.reschedule(this.runInterval);
    }
}
