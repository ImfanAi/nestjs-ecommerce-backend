import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { AbiCoder } from "ethers/lib/utils";
import { AddressService } from "src/address/address.service";
import { CallbackBody } from "src/baseListener/callback.body";
import { Bep20Service } from "src/bep20/bep20.service";
import { LogService } from "src/clogs/log.service";
import { RequestService } from "src/request/request.service";
import { Token } from "src/tokens/token.entity";
import { TokenService } from "src/tokens/token.service";
import { CreateTransactionDto } from "src/transactions/dto/create-transaction.dto";
import { TransactionsService } from "src/transactions/transactions.service";
import { LinkedList } from "src/utils/LinkedList";
import { UtilsService } from "src/utils/utils.service";
const TronWeb = require('tronweb');
const ethers = require('ethers');

type CONTRACT_VALUE = {
    owner_address: string; // sender address
    amount?: number; // TRX transfer case
    data?: string; // TRC20 transfer case
    to_address?: string; // receiver address
    contract_address?: string; // TRC20 contract case
}

type TXN_PARAMETER = {
    value: CONTRACT_VALUE;
}

type TXN_CONTRACT = {
    parameter: TXN_PARAMETER;
    type: string;
}

type TXN_RAW_DATA = {
    contract: TXN_CONTRACT[];
    data: string;
}

type TXN = {
    txID: string;
    raw_data: TXN_RAW_DATA
}

type BLK_RAW_DATA = {
    number: number;
    timestamp: number;
}

type BLK_HEADER = {
    raw_data: BLK_RAW_DATA
}

type TRON_BLOCK = {
    block_header: BLK_HEADER
    transactions: TXN[];
}

@Injectable()
export class Trc20Service {
    constructor (
        @Inject(forwardRef(() => TokenService))
        private readonly tokenService: TokenService,
        private readonly txnService: TransactionsService,
        private readonly addressService: AddressService,
        private readonly paymentService: RequestService
    ) {
        this.init();
        this.reschedule(5000);
    }

    /** For decoding parameter data */
    AbiCoder = ethers.utils.AbiCoder;
    ADDRESS_PREFIX_REGEX = /^(41)/;
    ADDRESS_PREFIX = "41";

    /** For listening to transactions */
    tronWeb: any = undefined;
    network: string = 'TRON';
    tokenName: string = 'TRX';

    tokens: Token[] = [];
    netToken: Token = undefined;

    latestBlkNumber: number = 0;
    runInterval: number = 15000;

    handle: ReturnType<typeof setTimeout> = undefined;

    /** Cache for fetched blocks */
    blockCache: LinkedList<TRON_BLOCK> = new LinkedList();

    async runSync() {

        const foundTransactions: CreateTransactionDto[] = [];

        const tokens = await this.tokenService.findBy({network: this.network});
        this.tokens = tokens.filter(token => token.name !== this.tokenName);


        this.tokens.forEach(token => {
            // convert to hex for easy comparing
            token.address = this.tronWeb.address.toHex(token.address);
        });

        // check tokens numbers
        if(this.tokens.length === 0) {
            this.reschedule(3000);
            return;
        }

        let bn: TRON_BLOCK = null;

        // compare last sync block to latestBlkNumber
        let lastSyncBlock = +this.tokens[0].syncBlock;

        // startup condition + behind current block case
        if(this.latestBlkNumber === 0 || lastSyncBlock >= this.latestBlkNumber) {
            // need to sync new block
            bn = await this.tronWeb.trx.getCurrentBlock();
            console.log(`current TRON blocknumber is ${bn.block_header.raw_data.number}`)
            this.latestBlkNumber = bn.block_header.raw_data.number;
            this.blockCache.insertAtEnd(bn);

            // reschedule
            this.reschedule(1000);
            return;
        } else {
            // behind
            // 1) check block cache
            const cached = this.blockCache.search(item =>
                item.block_header.raw_data.number === (lastSyncBlock + 1));
            if(cached.length > 0) {
                // use cached item
                bn = cached[0];

                // remove from cache
                await this.blockCache.deleteByData(item =>
                    item.block_header.raw_data.number === lastSyncBlock + 1);
            } else {
                // not in cache
                bn = await this.tronWeb.trx.getBlockByNumber(lastSyncBlock + 1);
            }
        }

        // get transactions
        bn.transactions.forEach(async (txn) => {
            // check transaction type
            const txnContract = txn.raw_data.contract[0];

            // TRC20 tokens transfer
            if(txnContract.type === 'TriggerSmartContract') {
                // check token address
                const matched = this.tokens.find((token) =>
                    token.address === txnContract.parameter.value.contract_address);
                if(!matched) return;

                // decode data
                let decoded = null;
                let receivedAmount: any;
                let receiverAddress: string;
                try {
                    const data = txnContract.parameter.value.data;

                    if(data.length === 136) {
                        // transfer
                        const param = `${data.substring(0, 30)}00${data.substring(32, data.length)}`
                        decoded = await this.decodeParams(['address', 'uint256'], param, true);
                        receiverAddress = this.tronWeb.address.fromHex(decoded[0]);
                        receivedAmount = decoded[1]._hex;
                    } else if (data.length === 200) {
                        // transfer from
                        let param = `${data.substring(0, 30)}00${data.substring(32, data.length)}`
                        param = `${param.substring(0, 94)}00${param.substring(96, param.length)}`
                        decoded = await this.decodeParams(['address', 'address', 'uint256'], param, true);
                        receiverAddress = this.tronWeb.address.fromHex(decoded[1]);
                        receivedAmount = decoded[2]._hex;
                    } else {
                        return;
                    }
                } catch (error) {
                    console.log(txnContract.parameter);
                    console.log(error.reason);
                    return;
                }

                // lookup receiver
                const addressObj = await this.addressService.checkAddress(receiverAddress);

                // updated for test!!!
                if(!addressObj || addressObj.address != receiverAddress) return;

                // exists!!!!
                const createTxnDto: CreateTransactionDto = {
                    token: matched,
                    request: addressObj.paymentRequests[0],
                    txnHash: txn.txID,
                    amount: receivedAmount,
                    logId: txn.txID,
                    createdAt: new Date()
                }
                foundTransactions.push(createTxnDto);
                try {
                    await this.txnService.create(createTxnDto);
                    await this.paymentService.updatePaymentStatus(
                        addressObj.paymentRequests[0].id, receivedAmount
                    );
                } catch (error) {
                    // duplicate error ?
                    console.log(error);
                    return;
                }


            } else if(txnContract.type === 'TransferContract') {
                // get to address and check receiver is nyyu
                const receiverAddress = txnContract.parameter.value.to_address;
                const addressObj = await this.addressService.checkAddress(receiverAddress);
                if(!addressObj || addressObj.address !== receiverAddress) return;

                // received amount
                const receivedAmount = txnContract.parameter.value.amount;

                // transaction log
                const createTxnDto: CreateTransactionDto = {
                    token: this.netToken,
                    request: addressObj.paymentRequests[0],
                    txnHash: txn.txID,
                    amount: receivedAmount.toString(),
                    logId: txn.txID,
                    createdAt: new Date()
                }
                foundTransactions.push(createTxnDto);

                try {
                    await this.txnService.create(createTxnDto);
                    await this.paymentService.updatePaymentStatus(
                        addressObj.paymentRequests[0].id, receivedAmount
                    )
                } catch (error) {
                    console.log(error);
                    return;
                }
            }
        });

        // update token sync number
        await this.tokenService.updateTokenSyncByNetwork(this.network, (lastSyncBlock + 1).toString());
        this.reschedule(15000);
        return foundTransactions;
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

    async init() {
        // test function
        this.tronWeb = new TronWeb({
            fullHost: `${process.env.TRON_NET_URL}`,
            headers: { "TRON-PRO-API-KEY": `${process.env.TRON_API_KEY}` },
            privateKey: `${process.env.TRON_PRIV_KEY}`
        })

        this.netToken = await this.tokenService.findOne({network: this.network, name: this.tokenName});
    }

    async decodeParams(types: [string, string] | [string, string, string], output: any, ignoreMethodHash: any) {
        if (!output || typeof output === 'boolean') {
            ignoreMethodHash = output;
            output = types;
        }

        if (ignoreMethodHash && output.replace(/^0x/, '').length % 64 === 8)
            output = '0x' + output.replace(/^0x/, '').substring(8);

        const abiCoder = new AbiCoder();

        if (output.replace(/^0x/, '').length % 64)
            throw new Error('The encoded string is not valid. Its length must be a multiple of 64.');
        return abiCoder.decode(types, output).reduce((obj, arg, index) => {
            if (types[index] == 'address')
                arg = this.ADDRESS_PREFIX + arg.substr(2).toLowerCase();
            obj.push(arg);
            return obj;
        }, []);
    }
}
