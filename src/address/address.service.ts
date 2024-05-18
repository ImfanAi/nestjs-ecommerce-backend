import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

import * as solanaWeb3 from '@solana/web3.js';
import { Repository } from 'typeorm';
import { Address } from './entity/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { tokenAbi } from 'src/baseListener/token.abi';
import { base58 } from 'ethers/lib/utils';
import axios from 'axios';

const TronWeb = require('tronweb');
const ethers = require('ethers');
const randomSecure = require('secure-random');

const BTC_BALANCE_URL = 'https://blockchain.info/balance';

import { ec } from 'elliptic';
import { sha256 } from 'js-sha256';
import ripemd160 from 'ripemd160';
import { BSC_NETWORK, BTC_NETWORK, ERC_NETWORK, SOL_NETWORK, TRC_NETWORK } from 'src/constants';

// Convert a hex string to a byte array
function hexToBytes(hex: string): Uint8Array {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return Uint8Array.from(bytes);
}

// Convert a byte array to a hex string
function bytesToHex(bytes: Uint8Array) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
        var current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
        hex.push((current >>> 4).toString(16));
        hex.push((current & 0xF).toString(16));
    }
    return hex.join("");
}

@Injectable()
export class AddressService {

    constructor(
        @Inject('ADDRESS_REPOSITORY')
        private readonly addressRepository: Repository<Address>,
    ) {
        this.init();
    }

    withdrawPrivKeys: Map<string, string> = new Map();

    bepNetwork: Web3 = null;
    ethNetwork: Web3 = null;
    ercNetwork: Web3 = null;
    trcNetwork = null;
    solNetwork: solanaWeb3.Connection = null;
    btcNetwork = null;

    // generate wallet address
    async generateNewWallet(network: string) {
        let address = null, privateKey = null;
        const _network = network === ERC_NETWORK ? BSC_NETWORK : network;
        switch (_network) {
            case BSC_NETWORK:
                const account = this.bepNetwork.eth.accounts.create();
                address = account.address;
                privateKey = account.privateKey;
                break;
            case TRC_NETWORK:
                const tronAccount = await this.trcNetwork.createAccount();
                address = tronAccount.address.base58;
                privateKey = tronAccount.privateKey;
                break;
            case BTC_NETWORK:
                const btcAddress = this.generateBtcAddress();
                address = btcAddress.address;
                privateKey = btcAddress.privateKey;
                break;
            case SOL_NETWORK:
                const solKeyPair = solanaWeb3.Keypair.generate();
                privateKey = bytesToHex(solKeyPair.secretKey);
                address = solKeyPair.publicKey.toBase58();
                break;
            default:
                throw new BadRequestException({
                    status: 'failed',
                    error: true,
                    msg: 'This token is not supported',
                    address: null
                });
        }
        const createAddressDto: CreateAddressDto = {
            network,
            address,
            privateKey,
            activatedAt: new Date()
        }

        const created = await this.addressRepository.save(createAddressDto);
        return created;
    }

    // for only test purpose
    async insertDummyAddress(network: string, address: string) {
        const createAddressDto: CreateAddressDto = {
            network,
            address,
            privateKey: 'dummy private key',
            activatedAt: new Date()
        }
        return await this.addressRepository.save({
            ...createAddressDto,
            status: 'pending',
            available: false,
        });
    }

    // for only test purpose
    async deleteDummyAddress(network: string, address: string) {
        return await this.addressRepository.delete({network, address});
    }

    // found available address
    async getAvailableAddress(network: string) {
        const addresses = await this.addressRepository.find({
            where: {network, available: true},
        });

        if(addresses.length === 0) {
            const newAddress = await this.generateNewWallet(network);
            return newAddress
        }
        return addresses[0];
    }

    async getAddress(address: string, includePrivKey: boolean = false): Promise<Address> {
        let addressObj: any = null;
        const { id, privateKey, ...result } = await this.addressRepository.findOne({where: {address}});
        addressObj = result;
        if(includePrivKey) {
            addressObj.privateKey = privateKey;
        }
        return addressObj;
    }

    async checkAddress(address: string) {
        const matchedOne = await this.addressRepository.createQueryBuilder('address')
            .leftJoinAndSelect("address.paymentRequests", "request")
            .where("address.address = :address", {address})
            .andWhere('address.available = :available', {available: false})
            .andWhere('request.status = :status', {status: 'pending'})
            .getOne();
        return matchedOne;
    }

    async updateAddressStatus(address: string, status: boolean) {
        await this.addressRepository.update({address}, {available: status})
    }

    async init() {
        this.bepNetwork = new Web3(new Web3.providers.HttpProvider(process.env.BSC_JSON_RPC));
        this.ercNetwork = new Web3(new Web3.providers.HttpProvider(process.env.ETH_JSON_RPC));
        // this.btcNetwork = new BtcClient();
        this.trcNetwork = new TronWeb({
            fullHost: `${process.env.TRON_NET_URL}`,
            headers: { "TRON-PRO-API-KEY": `${process.env.TRON_API_KEY}` },
            privateKey: `${process.env.TRON_PRIV_KEY}`
        });

        const namepass = process.env.SOL_USERNAME+":"+process.env.SOL_PASSWORD;
        this.solNetwork = new solanaWeb3.Connection(`${process.env.SOL_JSON_RPC}`, {
            httpHeaders: {
                'Authorization': `Basic ${btoa(namepass)}`
            }
        });

        // init withdraw wallet private keys
        this.withdrawPrivKeys.set(BSC_NETWORK, process.env.BSC_PRIV_KEY);
        this.withdrawPrivKeys.set(ERC_NETWORK, process.env.ERC_PRIV_KEY);
        this.withdrawPrivKeys.set(TRC_NETWORK, process.env.TRX_PRIV_KEY);
        this.withdrawPrivKeys.set(SOL_NETWORK, process.env.SOL_PRIV_KEY);
        this.withdrawPrivKeys.set(BTC_NETWORK, '');
    }

    // send funds to external wallet
    async withdrawFunds(network: string, to: string, amount: number, privKey?: string, contractAddress?: string) {
        let hash = null;
        if(!privKey) privKey = this.withdrawPrivKeys.get(network);
        switch(network) {
            case BSC_NETWORK:
                if(contractAddress) {
                    hash = await this.sendERC20(this.bepNetwork, privKey, to, amount, contractAddress);
                } else {
                    hash = await this.sendETH(this.bepNetwork, privKey, to, amount);
                }
            break;
            case ERC_NETWORK:
                if(contractAddress) {
                    hash = await this.sendERC20(this.ercNetwork, privKey, to, amount, contractAddress);
                } else {
                    hash = await this.sendETH(this.ercNetwork, privKey, to, amount);
                }
            break;
            case TRC_NETWORK:
                if(contractAddress) {
                    hash = await this.sendTRX(to, amount);
                } else {
                    hash = await this.sendTRC20(to, contractAddress, amount);
                }
            break;
            case BTC_NETWORK:

            break;
            case SOL_NETWORK:
                hash = await this.sendSOL(to, privKey, Number(amount));
            break;
            default:
                throw new BadRequestException({
                    status: 'failed',
                    error: true,
                    msg: 'This token is not supported',
                    address: null
                });
        }
        return hash;
    }

    private generateBtcAddress() {
		const max = Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140", 'hex');
		let isInvalid = true;
		let privateKey = null;
		while(isInvalid) {
			privateKey = randomSecure.randomBuffer(32);
			if(Buffer.compare(max, privateKey) === 1)
				isInvalid = false;
		}
		const ecdsa = new ec('secp256k1');
		const keys = ecdsa.keyFromPrivate(privateKey);
		const publicKey = keys.getPublic('hex');

		const hash = sha256(Buffer.from(publicKey, 'hex'));
		const publickKeyHash = new ripemd160().update(Buffer.from(hash, 'hex')).digest();

		const leadingZero = Buffer.from("00" + publickKeyHash.toString('hex'), 'hex');
		const sha = sha256(leadingZero);
		const shaAgain = sha256(Buffer.from(sha, 'hex'));
		const checksum = shaAgain.substring(0, 8);
		const last = leadingZero.toString('hex') + checksum;

		const address = base58.encode(Buffer.from(last, 'hex'));
		return {
			address, privateKey: privateKey.toString('hex')
		}
	}

    ////////////////////////////////////////////////////////////////////////
    //////////////////////  These are withdrawal functsions  ///////////////
    ////////////////////////////////////////////////////////////////////////
    // send BNB or Ether
    async sendETH(network: Web3, privKey: string, to: string, amount: number) {
        const address = network.eth.accounts.privateKeyToAccount(privKey).address;
        const nonce = await network.eth.getTransactionCount(address, 'latest');
        const gasPrice = await network.eth.getGasPrice();
        const amountToSend = amount * Math.pow(10, 18);
        const transaction = {
            'to': to,
            'value': amountToSend,
            'gas': 30000,
            nonce,
            gasPrice
        }
        const signedTx = await network.eth.accounts.signTransaction(transaction, privKey);
        const receipt = await network.eth.sendSignedTransaction(signedTx.rawTransaction);
        return receipt.transactionHash;
    }

    // send erc20 or bep20 tokens
    async sendERC20(network: Web3, privKey: string, to: string, amount: number, contractAddress: string) {
        try {
            const address = network.eth.accounts.privateKeyToAccount(privKey).address;
            const nonce = await network.eth.getTransactionCount(address, 'latest');

            const contract = new network.eth.Contract(tokenAbi as AbiItem[], contractAddress);
            const decimals = await contract.methods.decimals().call();
            const gasPrice = await network.eth.getGasPrice();
            const amountToSend = amount * Math.pow(10, decimals);
            const  rawTransaction = {
                "from": address,
                "gasLimit": 150000,
                "to": contractAddress,
                "value": "0x0",
                "data": contract.methods.transfer(to, amountToSend).encodeABI(),
                nonce,
                gasPrice
            }

            const signedTx = await network.eth.accounts.signTransaction(rawTransaction, privKey);
            const receipt = await network.eth.sendSignedTransaction(signedTx.rawTransaction);
            return receipt.transactionHash;
        } catch (error) {
            // cannot send token
            console.log(`cannot send from ${contractAddress} to ${to}`);
            return null;
        }
    }

    // in SUN
    async sendTRX(to: string, amount: number) {
        try {
            const amountToSend = this.trcNetwork.toSun(amount);
            const unSignedTxn = await this.trcNetwork.transactionBuilder.sendTrx(to, amountToSend);
            const signedTxn = await this.trcNetwork.trx.sign(unSignedTxn);
            const ret = await this.trcNetwork.trx.sendRawTransaction(signedTxn);
            return ret.txID;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    async sendTRC20(to: string, contractAddress: string, amount: number) {
        try {
            const amountToSend = this.trcNetwork.toSun(amount);
            const { abi } = await this.trcNetwork.trx.getContract(contractAddress);
            const contract = this.trcNetwork.contract(abi.entrys, contractAddress);
            const ret = await contract.methods.transfer(to, amount).send();
            return ret.txID;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    // in Lamports
    async sendSOL(to: string, privKey: string, amount: number) {
        const from = solanaWeb3.Keypair.fromSecretKey(base58.decode(privKey));
        const toPubKey = new solanaWeb3.PublicKey(to);
        const transaction = new solanaWeb3.Transaction().add(
            solanaWeb3.SystemProgram.transfer({
                fromPubkey: from.publicKey,
                toPubkey: toPubKey,
                lamports: amount * solanaWeb3.LAMPORTS_PER_SOL,
            })
        );
        return await solanaWeb3.sendAndConfirmTransaction(
            this.trcNetwork,
            transaction,
            [from]
        );
    }


    ///////////////////////// get balance functions ///////////////////////
    // in decimal balance //
    async getBalance(network: string, address: string, contractAddress?: string) {
        switch (network) {
            case BSC_NETWORK:
                if(contractAddress) {
                    return await this.getERC20Balance(this.bepNetwork, address, contractAddress);
                } else {
                    return await this.getETHBalance(this.bepNetwork, address);
                }
            case ERC_NETWORK:
                if(contractAddress) {
                    return await this.getERC20Balance(this.ercNetwork, address, contractAddress);
                } else {
                    return await this.getETHBalance(this.ercNetwork, address);
                }
            case SOL_NETWORK:
                return await this.getSolBalance(address);
            case TRC_NETWORK:
                if(contractAddress) {
                    return await this.getTRCBalance(address, contractAddress);
                } else {
                    return await this.getTrxBalance(address);
                }
            case BTC_NETWORK:
                return await this.getBtcBalance(address);
            default:
                return null;
        }
    }

    async getETHBalance(network: Web3, address: string): Promise<number> {
        const balance = await network.eth.getBalance(address); // balance in wei
        return Number(balance) / Math.pow(10, 18);
    }

    async getERC20Balance(network: Web3, address: string, contractAddress: string): Promise<number> {
        const contract = new network.eth.Contract(tokenAbi as AbiItem[], contractAddress);
        const decimals = await contract.methods.decimals().call();
        const balance = await contract.methods.balanceOf(address).call();
        return Number(balance) / Math.pow(10, decimals);
    }

    // in TRX decimal
    async getTrxBalance(address: string): Promise<number> {
        const sun = await this.trcNetwork.trx.getBalance(address); // in SUN
        return await this.trcNetwork.fromSun(sun);
    }

    // in USDT
    async getTRCBalance(address: string, contractAddress: string) {
        const contract = await this.trcNetwork.contract().at(contractAddress);
        const balance = await contract.balanceOf(address).call();
        const decimals = await contract.decimals().call();
        return Number(balance) / Math.pow(10, decimals);
    }

    // in SOL
    async getSolBalance(address: string) {
        const addressObj: Address = await this.getAddress(address, true);
        if(!addressObj) {
            return 0;
        }

        const keyPair = solanaWeb3.Keypair.fromSecretKey(
            hexToBytes(addressObj.privateKey)
        )
        const lamports = await this.solNetwork.getBalance(keyPair.publicKey); // in Lamports
        return lamports / solanaWeb3.LAMPORTS_PER_SOL;
    }

    async getBtcBalance(address: string) {
        try {
            const balanceResponse = await axios({
                method: 'GET',
                url: BTC_BALANCE_URL,
                params: {
                    active: address
                }
            });
            return balanceResponse.data[address].final_balance;
        } catch (error) {
            console.log(error);
            return null;
        }
    }


}
