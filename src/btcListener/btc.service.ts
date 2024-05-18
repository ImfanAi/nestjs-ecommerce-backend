import { forwardRef, Inject, Injectable } from "@nestjs/common";
import axios from "axios";
import { AddressService } from "src/address/address.service";
import { BTC_NETWORK } from "src/constants";
import { RequestService } from "src/request/request.service";
import { TokenService } from "src/tokens/token.service";
import { CreateTransactionDto } from "src/transactions/dto/create-transaction.dto";
import { TransactionsService } from "src/transactions/transactions.service";

const LATEST_BLOCK = 'https://blockchain.info/latestblock';
const BLOCK_HEIGHT = 'https://blockchain.info/block-height/';

type TXN_OUT = {
	type: number;
    spent: boolean;
    value: number;
    spending_outpoints: [],
    n: number;
    tx_index: number;
    script: string;
    addr?: string;
}

type BTC_TXN = {
    hash: string;
    block_height: number;
    tx_index: number;
    out: TXN_OUT[]
}

type BTC_BLOCK = {
    hash: string;
    prev_block: string;
    time: number;
    fee: number;
    height: number;
    tx: BTC_TXN[]
}

type BTC_LAST_BLOCK = {
    hash: string;
    height: number;
    txIndexes: number[]
}

@Injectable()
export class BtcService {
    constructor(
        @Inject(forwardRef(() => TokenService))
        private readonly tokenService: TokenService,
        private readonly txnService: TransactionsService,
        private readonly addressService: AddressService,
        private readonly paymentService: RequestService
    ) {
        console.log('BTC service has been initialized');
        this.init();
    }

    handle: ReturnType<typeof setTimeout> = undefined;
    runInterval: number = 15000;

    async init() {
        this.reschedule(1000);
    }

    async runSync () {
        try {
            const founds: CreateTransactionDto[] = [];

            // get latest block height
            const lastBlockResponse = await axios.get(LATEST_BLOCK);
            const lastBlock: BTC_LAST_BLOCK = lastBlockResponse.data;
            const lastBlockHeight = lastBlock.height;

            // get last syncked block height
            const token = await this.tokenService.findOne({network: BTC_NETWORK, name: "BTC"})
            if(!token) this.reschedule(15000);

            let syncHeight = +token.syncBlock;

            // get transactions
            syncHeight++; // avoid latest sync block
            if(lastBlockHeight <= syncHeight) {
                this.reschedule(15000);
                return [];
            }

            const { data: _blockByHeight } = await axios.get(`${BLOCK_HEIGHT}${syncHeight}`);
            const block: BTC_BLOCK = _blockByHeight.blocks[0];

            // get output
            block.tx.forEach(async tx => {
                tx.out.forEach(async _out => {
                    if(_out.addr) {

                        // check address
                        const matched = await this.addressService.checkAddress(_out.addr);
                        if(!matched || matched.address !== _out.addr) return;

                        // BTC deposit detected
                        const receivedAmount = _out.value;

                        const createTxnDto: CreateTransactionDto = {
                            token,
                            request: matched.paymentRequests[0],
                            txnHash: tx.hash,
                            amount: receivedAmount.toString(),
                            logId: tx.tx_index.toString(),
                            createdAt: new Date()
                        }
                        founds.push(createTxnDto);
                        try {
                            // send callback
                            await this.txnService.create(createTxnDto);
                            await this.paymentService.updatePaymentStatus(
                                matched.paymentRequests[0].id, receivedAmount
                            );
                        } catch (error) {
                            console.log(error);
                            return;
                        }
                    }
                })
            })

            // update token sync number
            await this.tokenService.updateTokenSyncByNetwork('BTC', syncHeight.toString());
            await new Promise(r => setTimeout(r, 100));
            return founds;

        } catch (error) {
        } finally {
            this.reschedule(1000);
        }
    }

    reschedule (delay?: number) {
        if(this.handle) {
            clearTimeout(this.handle);
        }

        const nextRun = delay || this.runInterval;
        this.handle = setTimeout(async () => {
            await this.runSync();
        }, nextRun);
    }
}
