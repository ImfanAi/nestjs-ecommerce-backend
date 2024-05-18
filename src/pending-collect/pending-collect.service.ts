import { Inject, Injectable } from '@nestjs/common';
import { AddressService } from 'src/address/address.service';
import { BSC_NETWORK, BTC_NETWORK, SOL_NETWORK, TRC_NETWORK, ERC_NETWORK } from 'src/constants';
import { TokenService } from 'src/tokens/token.service';
import { Repository } from 'typeorm';
import { CreatePendingCollectDto } from './dto/create-pending-collect.dto';
import { UpdatePendingCollectDto } from './dto/update-pending-collect.dto';
import { PendingCollect } from './entities/pending-collect.entity';

type NETWORK_META = {
    address: string;
    min: number;
}

@Injectable()
export class PendingCollectService {
    constructor(
        @Inject('PENDINGCOLLECT_REPOSITORY')
        private collectRepository: Repository<PendingCollect>,
        private addressService: AddressService,
        private tokenService: TokenService
    ) {
        this.adminWalletMap.set(BSC_NETWORK, {
            address: process.env.ETH_ADMIN_ADDRESS,
            min: 0.0005
        });
        this.adminWalletMap.set(ERC_NETWORK, {
            address: process.env.ETH_ADMIN_ADDRESS,
            min: 0.0009
        });
        this.adminWalletMap.set(TRC_NETWORK, {
            address: process.env.TRX_ADMIN_ADDRESS,
            min: 10
        });
        this.adminWalletMap.set(SOL_NETWORK, {
            address: process.env.SOL_ADMIN_ADDRESS,
            min: 0.00001
        });
        this.adminWalletMap.set(BTC_NETWORK, {
            address: process.env.BTC_ADMIN_ADDRESS,
            min: 0.002
        });
    }

    // admin wallet address
    adminWalletMap: Map<string, NETWORK_META> = new Map();

    // looping
    runInterval: number = 60000;
    handle: ReturnType<typeof setTimeout> = undefined;

    async run() {
        // fetch pending address
        const pendings = await this.getPendingAddresses();

        // no address => go to reschedule
        if(pendings.length === 0) {
            this.reschedule(10000);
            return;
        }

        pendings.forEach(async (pendingAddress: PendingCollect) => {
            // check target token balance
            const { network, coin, address, contractAddress } = pendingAddress;

            // get wallet meta from map
            const walletmeta = this.adminWalletMap.get(network);

            // in wei
            const balance = await this.addressService.getBalance(network, address, contractAddress);

            if(+balance === 0) {
                // remove from pending list
                await this.updatePendingAddress(address, {
                    baseTxHash: null,
                    pending: false,
                    sentBase: false,
                    updatedAt: new Date(Date.now()),
                    transactionHash: null
                })
                return;
            };

            // collecting action
            const addressObj = await this.addressService.getAddress(address, true);
            if(network === coin) {
                // sending
                const param = {
                    baseTxHash: null,
                    pending: false,
                    sentBase: false,
                    updatedAt: new Date(Date.now()),
                    transactionHash: null
                }
                if(balance > walletmeta.min) {
                    const hash = await this.addressService.withdrawFunds(
                        network, walletmeta.address, balance - walletmeta.min, addressObj.privateKey);

                    // update pending collect
                    await this.updatePendingAddress(address, {
                        ...param,
                        transactionHash: hash
                    });
                } else {
                    await this.updatePendingAddress(address, param);
                }
            } else {
                // check base token
                const netBalance = await this.addressService.getBalance(network, address);

                // if net balance is less than predefined value or sent base is false
                if(+netBalance < walletmeta.min) {
                    // check sent base flag for preventing double sending
                    if(!pendingAddress.sentBase) {
                        // need to send base token first
                        const baseHash = await this.addressService.withdrawFunds(network, address, 0);
                        await this.updatePendingAddress(address, {
                            baseTxHash: baseHash,
                            pending: true,
                            sentBase: true,
                            updatedAt: new Date(Date.now()),
                            transactionHash: null
                        });
                    }
                } else {
                    const token = await this.tokenService.findOne({network, name: coin}, []);
                    const hash = await this.addressService.withdrawFunds(
                        network, walletmeta.address, balance, addressObj.privateKey, token.address
                    )

                    await this.updatePendingAddress(address, {
                        pending: false,
                        updatedAt: new Date(Date.now()),
                        transactionHash: hash
                    });
                }
            }

        });

        // reschedule
        this.reschedule(10000);

    }

    async reschedule(delay?: number) {
        if(this.handle) {
            clearTimeout(this.handle);
        }

        const nextRun = delay || this.runInterval;
        this.handle = setTimeout(async () => {
            await this.run();
        }, nextRun);
    }

    // insert new pending collect address
    async createNewPending(dto: CreatePendingCollectDto): Promise<PendingCollect> {
        return await this.collectRepository.save(dto);
    }

    // get all pending addresses
    async getPendingAddresses(): Promise<PendingCollect[]> {
        return await this.collectRepository.find({
            where: {pending: true}
        })
    }

    // update
    async updatePendingAddress(address: string, dto: UpdatePendingCollectDto) {
        return await this.collectRepository.update({address}, dto);
    }

    // get all approved addresses
    async getApprovedAddresses() {
        return await this.collectRepository.find({where: {pending: false}});
    }

}
