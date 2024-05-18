import { Injectable } from "@nestjs/common";
import { RequestService } from "src/request/request.service";
import { Token } from "src/tokens/token.entity";
import { CreateTransactionDto } from "src/transactions/dto/create-transaction.dto";
import { TransactionsService } from "src/transactions/transactions.service";
import { LinkedList } from "src/utils/LinkedList";
import { PendingTxn } from "src/utils/pending.txn";
import { UtilsService } from "src/utils/utils.service";
import Web3 from "web3";
import { CallbackBody } from "./callback.body";

@Injectable()
export class EthCacheService {
    constructor(
        private readonly txnService: TransactionsService,
        private readonly utilService: UtilsService,
        private readonly paymentService: RequestService,
    ) {}

    web3: Web3 = null;
    network: string = '';
    txns: LinkedList<PendingTxn> = new LinkedList();
    runInterval: number = 3000;
    handle: ReturnType<typeof setTimeout> = undefined;
    token: Token | undefined = undefined;

    async checkTxns() {
        const currentBlock = await this.web3.eth.getBlockNumber();

        const matched = this.txns.search(({blockNumber}) => currentBlock - blockNumber > 10);
        matched.forEach(async (txn: PendingTxn) => {
            const txnReceipt = await this.web3.eth.getTransactionReceipt(txn.txnHash);
            if(txnReceipt.status) {
                // get txn from cache
                const { addressObj } = txn;
                const createTxnDto: CreateTransactionDto = {
                    token: this.token,
                    request: addressObj.paymentRequests[0],
                    txnHash: txn.txnHash,
                    amount: txn.amount,
                    logId: this.utilService.generateRandomId(32),
                    createdAt: new Date()
                }

                await this.txnService.create(createTxnDto);
                await this.paymentService.updatePaymentStatus(
                    addressObj.paymentRequests[0].id, Number(txn.amount)
                );
                await this.txns.deleteByData(({txnHash}) => txn.txnHash === txnHash);

            } else {
                await this.txns.deleteByData(({txnHash}) => txn.txnHash === txnHash);
            }
        })
        this.reschdule(3000);
    }

    reschdule(delay?: number) {
        if (this.handle) {
            clearTimeout(this.handle);
        }
        const nextRun = delay || this.runInterval;
        this.handle = setTimeout(async () => {
            await this.checkTxns();
        }, nextRun);
    }

    init(network: string, rpcUrl: string, token: Token) {
        this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
        this.token = token;
        this.network = network;
        this.reschdule();
    }
}
