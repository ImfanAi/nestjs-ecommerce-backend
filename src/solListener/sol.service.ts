import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { TokenService } from "src/tokens/token.service";
import * as solanaWeb3 from '@solana/web3.js';
import { Bep20Service } from "src/bep20/bep20.service";
import { base58_to_binary } from 'base58-js'
import { CreateTransactionDto } from "src/transactions/dto/create-transaction.dto";
import { Token } from "src/tokens/token.entity";
import ReceiverService from "src/baseListener/receiver.interface";
import { UtilsService } from "src/utils/utils.service";
import { TransactionsService } from "src/transactions/transactions.service";
import { LogService } from "src/clogs/log.service";
import { CallbackBody } from "src/baseListener/callback.body";
import { MissedBlockService } from "src/missing/missedBlock.service";
import { MissedBlockDto } from "src/missing/missedBlock.dto";
import { AddressService } from "src/address/address.service";
import { RequestService } from "src/request/request.service";

@Injectable()
export class SolService {
    constructor(
        @Inject(forwardRef(() => TokenService))
        private readonly tokenService: TokenService,
        private readonly bepService: Bep20Service,
        private readonly utilService: UtilsService,
        private readonly transactionService: TransactionsService,
        private readonly logService: LogService,
        private readonly missedService: MissedBlockService,
        private readonly addressService: AddressService,
        private readonly paymentService: RequestService
    ) {
        // this.init();
        // this.reschedule();
    }

    web3: solanaWeb3.Connection = null;

    // solana token
    token: Token = undefined;
    network: string = "SOLANA";

    runInterval: number = 15000;
    minBlockDiff: number = 20;

    handle: ReturnType<typeof setTimeout> = undefined;

    receiverServie: ReceiverService = null;

    async init() {
        const namepass = process.env.SOL_USERNAME+":"+process.env.SOL_PASSWORD;
        this.web3 = new solanaWeb3.Connection(`${process.env.SOL_JSON_RPC}`, {
            httpHeaders: {
                'Authorization': `Basic ${btoa(namepass)}`
            }
        });
        setTimeout(async () => {
            const currentSlot = await this.web3.getSlot();
            this.token = await this.tokenService.findOne({network: 'SOL', name: 'SOLANA'});
            if(this.token !== null) {
                await this.tokenService.updateTokenSync(this.token.id, currentSlot.toString());
            }
            console.log(`solana last slot ${currentSlot} has been updated.`);
        }, 0)
    }

    reschedule(delay?: number) {
        if(this.handle) {
            clearTimeout(this.handle);
        }
        const nextRun = delay || this.runInterval;
        this.handle = setTimeout(async () => {
            await this.runSync();
        }, nextRun);
    }

    async runSync() {
        const founds: CreateTransactionDto[] = [];
        this.token = await this.tokenService.findOne({network: 'SOLANA', name: 'SOL'});

        if(this.token === null) {
            this.reschedule(this.runInterval);
            return;
        }

        const currentSlot = await this.web3.getSlot();
        console.log(`current SOLANA slot number is: ${currentSlot}`)
        if(currentSlot - +this.token.syncBlock < this.minBlockDiff) {
            this.reschedule(this.runInterval);
            return;
        }

        let syncBlock = +this.token.syncBlock + 1;
        let errorCount = 0;
        while (currentSlot > syncBlock) {
            let block = null;
            try {
                block = await this.web3.getBlock(syncBlock, {
                    maxSupportedTransactionVersion: 1
                });
            } catch (error) {
                console.log(error);
                errorCount++;
                if(errorCount > 2) {
                    syncBlock++;
                    errorCount = 0;

                    // save missed blocks for future use
                    const createdAt = new Date(Date.now()).toLocaleString();
                    const missedBlock: MissedBlockDto = {
                        blockNumber: syncBlock,
                        network: 'SOL',
                        fetched: false,
                        retry: 2,
                        createdAt,
                        updatedAt: createdAt
                    }
                    await this.missedService.insert(missedBlock);
                    await this.tokenService.updateTokenSync(this.token.id, syncBlock.toString());
                }
                await new Promise(r => setTimeout(r, 100));
                continue;
            }
            errorCount = 0;

            // loop through transactions
            block.transactions.forEach((_transaction) => {
                const { meta, transaction } = _transaction;
                if(meta.err !== null) return;

                // program id map checking
                const lowMessage: any = transaction.message;
                const accountKeys = transaction.message.accountKeys;

                let solTransferProgramId: number = -1;
                const solTransferKey = new solanaWeb3.PublicKey(0);
                lowMessage.indexToProgramIds.forEach((publicKey: solanaWeb3.PublicKey, index: number) => {
                    // if exists, 111....111 get id
                    if(publicKey.equals(solTransferKey)) {
                        solTransferProgramId = index;
                    }
                })
                if(solTransferProgramId === -1) return;

                // loop through instructions
                transaction.message.instructions.forEach(async (instruction) => {
                    if(solTransferProgramId !== instruction.programIdIndex) {
                        return; // continue
                    }

                    // if match program id
                    const receiverPublicKey = accountKeys[instruction.accounts[1]];

                    // check public key with database
                    const addressObj = await this.addressService.checkAddress(receiverPublicKey.toBase58());
                    if(!addressObj || addressObj.address !== receiverPublicKey.toBase58()) return;

                    // decode data
                    const dataBuffer = Buffer.from(base58_to_binary(instruction.data))
                    if(dataBuffer.length > 12) return;

                    const lamports = parseInt(dataBuffer.reverse().slice(0,8).toString('hex'), 16);

                    // insert transaction
                    const createTxnDto: CreateTransactionDto = {
                        token: this.token,
                        request: addressObj.paymentRequests[0],
                        txnHash: transaction.signatures[0],
                        amount: lamports.toString(),
                        logId: this.utilService.generateRandomId(32),
                        createdAt: new Date()
                    }
                    founds.push(createTxnDto);

                    console.log(`\nnew sol transaction ${createTxnDto.txnHash} is detected. \nAmount is ${createTxnDto.amount}\n`)

                    try {
                        await this.transactionService.create(createTxnDto);
                        await this.paymentService.updatePaymentStatus(
                            addressObj.paymentRequests[0].id, lamports
                        );
                    } catch (error) {
                        console.log(error);
                        return;
                    }


                })
            });

            await this.tokenService.updateTokenSync(this.token.id, syncBlock.toString());
            syncBlock++;
        }
        this.reschedule(5000);
        return founds;
    }
}
