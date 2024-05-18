const tokenAbi = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"constant": true,
		"inputs": [
			{
				"internalType": "address",
				"name": "_owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "getOwner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	}
]

const { BigNumber } = require('ethers');
const Web3 = require('web3');
const Redis = require('ioredis');

const axios = require('axios')
const TronWeb = require('tronweb');


const randomSecure = require('secure-random');
const ec = require('elliptic').ec;
const sha256 = require('js-sha256');
const ripemd160 = require('ripemd160');
const base58 = require('bs58');

const bitcoin = require('bitcoin')
const Client = require('bitcoin-core');

async function main() {

	const trcNetwork = new TronWeb({
		fullHost: `https://api.tron.nyyu.io`,
		headers: { "TRON-PRO-API-KEY": `74939bd6-a7d2-4cab-975d-ffbc42d77761` },
		privateKey: `ac03bf9e2850128076ddab6e4fa2f458ba0f03ccc95d553af2abbc3c92097c22`
	});

	console.log(trcNetwork.toSun(0.01))

	// const sun = await trcNetwork.trx.getBalance('TBdQDKrmfS1vERzZ5QKrnkJRZtPvsjvGkC'); // in SUN
    // console.log(await this.trcNetwork.fromSun(sun));

	const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-testnet.nodereal.io/v1/e6f1416c1d9644f68b09eb31f1c716a0"));
	const testAddress = '0x0B5C5f9F73e88a528614409Ef9740047E9dcee9A';
	const contractAddress = '0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684';
	const balance = await web3.eth.getBalance(testAddress)
	console.log(Number("1000000000000000000000000") / Math.pow(10, 18));

	const contract = new web3.eth.Contract(tokenAbi, contractAddress)
	const usdcBalance = await contract.methods.balanceOf(testAddress).call();
	const decimals = await contract.methods.decimals().call();
	console.log(Number(usdcBalance) / (Math.pow(10, decimals)));

	const client = new bitcoin.Client({
		host: '13.49.184.230',
		port: 8332,
		user: 'nyyupay',
		pass: 'LQDg8G452\&RZV2K\(',
		wallet: 'test wallet'
	})

	const core = new Client({
		host: '13.49.184.230',
		port: 8332,
		username: 'nyyupay',
		password: 'LQDg8G452\&RZV2K\(',
		network: 'mainnet'
	})


	function generateBtcAddress() {
		const max = Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140", 'hex');
		let isInvalid = true;
		let privateKey = null;
		while(isInvalid) {
			privateKey = randomSecure.randomBuffer(32);
			if(Buffer.compare(max, privateKey) === 1)
				isInvalid = false;
		}
		console.log('Private key: ', privateKey.toString('hex'));
		const ecdsa = new ec('secp256k1');
		const keys = ecdsa.keyFromPrivate(privateKey);
		const publicKey = keys.getPublic('hex');
		console.log('Public key: ', publicKey);

		const hash = sha256(Buffer.from(publicKey, 'hex'));
		const publickKeyHash = new ripemd160().update(Buffer.from(hash, 'hex')).digest();

		const leadingZero = Buffer.from("00" + publickKeyHash.toString('hex'), 'hex');
		const sha = sha256(leadingZero);
		const shaAgain = sha256(Buffer.from(sha, 'hex'));
		const checksum = shaAgain.substring(0, 8);
		const last = leadingZero.toString('hex') + checksum;

		const address = base58.encode(Buffer.from(last, 'hex'));
		return {
			address, privateKey
		}
	}

    try {

		const {address} = generateBtcAddress();
		// client.cmd('getbalance', address, 6, function(err, balance, resHeaders){
		// 	if(err) return console.log(err);
		// 	console.log('Balance: ', balance);
		// })

		const b = await core.getBalance();
		console.log(b);

		const info = await core.getBlockByHash('00000000000000000005433e587368ed4883f1a8cf3bebb22e747c5d35d7f821', { extension: 'json' });
		console.log(info);

		const balance = await core.getBalance({
			account: address,
			minconf: 0
		})
		console.log('Core balance: ', balance);

		const response = await axios.get(
			'https://blockchain.info/latestblock',
		)

		const block_height = response.data.height;

		const blocks = await axios.get(
			`https://blockchain.info/block-height/${block_height}`
		)
		console.log(blocks.data.blocks[0].tx[0].inputs[0].prev_out);
		console.log(blocks.data.blocks[0].tx[0]);

        // const web3 = new Web3('https://bsc-dataseed.binance.org/')

		// const PRIVATE_KEY = '3fca7d3a5e66bee67654172f9ca591aa3ecca2b298ffa46332b668059ca54eea';
		// const myAddress = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY).address
		// console.log(myAddress);
		// const toAddress = '0x0B5C5f9F73e88a528614409Ef9740047E9dcee9A';

		// const nonce = await web3.eth.getTransactionCount(myAddress, 'latest'); // nonce starts counting from 0
		// console.log(nonce);
		// const amount = 100; // BNB
		// // load contract
		// const contractAddress = '0xf8028b65005B0B45f76988d2A77910186E7af4eF'
		// const contract = new web3.eth.Contract(tokenAbi, contractAddress, {from: myAddress});


		// const decimals = await contract.methods.decimals().call();
		// console.log(decimals);

		// const amountToSend = amount * Math.pow(10, decimals);

		// var rawTransaction = {
		// 	"from":myAddress,
		// 	"gasLimit": 150000,
		// 	"to": contractAddress,
		// 	"value": "0x0",
		// 	"data": contract.methods.transfer(toAddress, amountToSend).encodeABI(),
		// 	"nonce": nonce
		// }

		// const signedTx = await web3.eth.accounts.signTransaction(rawTransaction, PRIVATE_KEY);

		// const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
		// console.log('receipt: ', receipt);
	} catch (error) {
		console.log('transaction failed');
		console.log(error);
	}

}
main();
