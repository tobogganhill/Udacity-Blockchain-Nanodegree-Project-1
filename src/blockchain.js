/*
 *  Class - Blockchain

 *  The Blockchain class contain the basics functions to create a private blockchain.
 *  It uses libraries like 'crypto-js' to create hashes for each block and 'bitcoinjs-message'
 *  to verify a message signature. The chain is stored in the array 'this.chain = []'.
 *  Each time the application is run, the chain will be empty since an array
 *  is not a persistent storage method.
 *
 */

const hex2ascii = require('hex2ascii');
const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {
	/*
	 * Constructor of the class. Setup the chain array and the height (the length of the chain array).
	 * Every time you create a Blockchain class you will need to initialize the chain creating
	 * the Genesis Block.
	 * The methods in this class will always return a Promise to allow client applications, or
	 * other backends to call asynchronous functions.
	 */
	constructor() {
		this.chain = [];
		this.height = -1;
		this.initializeChain();
	}

	/*
	 * This method will check for the height of the chain and if the Genesis Block does not exist, it will create it.
	 * Use the 'addBlock(block)' to create the Genesis Block
	 * Passing as data '{data: 'Genesis Block'}'
	 */
	async initializeChain() {
		if (this.height === -1) {
			console.log('Genesis Block');
			let block = new BlockClass.Block({ data: 'Genesis Block' });
			await this._addBlock(block);
		}
	}

	/*
	 * Utility method that return a Promise that will resolve with the height of the chain
	 */
	getChainHeight() {
		return new Promise((resolve, reject) => {
			resolve(this.height);
		});
	}

	/*
	 * _addBlock(block) will store a block in the chain
	 *
	 * @param {*} block
	 *
	 * The method will return a Promise that will resolve with the block added
	 * or rejected if an error happens during the execution.
	 * Check for the height to assign the 'previousBlockHash',
	 * assign the 'timestamp' and the correct 'height'. Finally, create the 'block hash'
	 * and push the block into the chain array. Don't forget to update the 'this.height'
	 * Note: the symbol '_' in the method name indicates in the javascript convention
	 * that the method is private.
	 */

	_addBlock(block) {
		let self = this;
		return new Promise(async (resolve, reject) => {
			let height = self.chain.length;
			block.previousBlockHash = self.chain[height - 1]
				? self.chain[height - 1].hash
				: null;
			block.height = height;
			// SHA256 requires a string of data
			block.time = new Date().getTime().toString().slice(0, -3);
			block.hash = await SHA256(JSON.stringify(block)).toString();
			const blockValid =
				block.hash &&
				block.hash.length === 64 &&
				block.height === self.chain.length &&
				block.time;
			blockValid
				? resolve(block)
				: reject(new Error('Cannot add an invalid block.'));
		})
			.catch((error) => console.log('ERROR: ', error))
			.then((block) => {
				// add block to chain
				this.chain.push(block);
				this.height = this.chain.length - 1;
				return block;
			});
	}

	/*
	 * The requestMessageOwnershipVerification(address) method
	 * will allow you to request a message used to
	 * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
	 * This is the first step before submitting the Block.
	 * The method returns a Promise that will resolve with the message to be signed.
	 *
	 * @param {*} address
	 */

	requestMessageOwnershipVerification(address) {
		return new Promise((resolve) => {
			let unsignedMessage = `${address}:${new Date()
				.getTime()
				.toString()
				.slice(0, -3)}:starRegistry`;
			resolve(unsignedMessage);
		});
	}

	/*
	 * The submitStar(address, message, signature, star) method
	 * will allow users to register a new Block with the star object
	 * into the chain. This method will resolve with the Block added or
	 * reject with an error.
	 *
	 * Algorithm steps:
	 * 1. Get the time from the message sent as a parameter example: 'parseInt(message.split(':')[1])'
	 * 2. Get the current time: 'let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));'
	 * 3. Check if the time elapsed is less than 5 minutes
	 * 4. Veify the message with wallet address and signature: 'bitcoinMessage.verify(message, address, signature)'
	 * 5. Create the block and add it to the chain
	 * 6. Resolve with the block added.
	 *
	 * @param {*} address
	 * @param {*} message
	 * @param {*} signature
	 * @param {*} star
	 */

	submitStar(address, message, signature, star) {
		let self = this;
		return new Promise(async (resolve, reject) => {
			let requestTime = parseInt(message.split(':')[1]);
			let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
			const spendTime = currentTime - requestTime;
			// reject on timeout
			if (spendTime >= 5 * 60)
				reject(new Error('Star submission request timed out.'));
			if (!bitcoinMessage.verify(message, address, signature))
				reject(new Error('Invalid message.'));
			// add block to chain & resolve
			let block = new BlockClass.Block({ star });
			block.owner = address;
			block = await self._addBlock(block);
			resolve(block);
		});
	}

	/*
	 * This method will return a Promise that will resolve the Block with the hash passed as a parameter.
	 * Search on the chain array for the block that has the hash.
	 *
	 * @param {*} hash
	 */

	getBlockByHash(hash) {
		let self = this;
		return new Promise((resolve, reject) => {
			resolve(self.chain.filter((block) => block.hash === hash)[0]);
		});
	}

	/*
	 * This method will return a Promise that will resolve with the Block object
	 * with the height equal to the parameter 'height'
	 *
	 * @param {*} height
	 */

	getBlockByHeight(height) {
		let self = this;
		return new Promise((resolve, reject) => {
			let block = self.chain.filter((p) => p.height === height)[0];
			block ? resolve(block) : resolve(null);
		});
	}

	/*
	 * This method will return a Promise that will resolve with an array of Stars objects existing in the chain
	 * and are belongs to the owner with the wallet address passed as parameter.
	 * Remember the star should be returned decoded.
	 *
	 * @param {*} address
	 */

	getStarsByWalletAddress(address) {
		let self = this;
		let stars = [];
		// validate chain
		this.validateChain().then((errors) =>
			typeof errors === 'string'
				? console.log('SUCCESS: ', errors)
				: errors.forEach((error) => console.log('ERROR: ', error))
		);
		return new Promise(async (resolve, reject) => {
			let ownedBlocks = self.chain.filter((block) => block.owner === address);
			if (ownedBlocks.length === 0) reject(new Error('Address not found.'));
			stars = ownedBlocks.map((block) => JSON.parse(hex2ascii(block.body)));
			stars ? resolve(stars) : reject(new Error('Failed to return stars.'));
		});
	}

	/*
	 * This method will return a Promise that will resolve with the list of errors when validating the chain.

	 * Steps to validate:
	 * ------------------
	 * 1. validate each block using 'validateBlock'
	 * 2. each Block should check the with the previousBlockHash
	 */
	validateChain() {
		let self = this;
		let errorLog = [];
		return new Promise(async (resolve, reject) => {
			for (let block of self.chain) {
				if (await block.validate()) {
					if (block.height > 0) {
						// skip genesis block
						let prevBlock = self.chain.filter(
							(b) => b.height === block.height - 1
						)[0];
						if (block.previousBlockHash !== prevBlock.hash) {
							errorLog.push(
								new Error(
									`Invalid link: Block #${
										block.height
									} not linked to the hash of block #${block.height - 1}.`
								)
							);
						}
					}
				} else {
					errorLog.push(
						new Error(`Invalid block #${block.height}: ${block.hash}`)
					);
				}
			}
			errorLog.length > 0 ? resolve(errorLog) : resolve('No errors detected.');
		});
	}
}

module.exports.Blockchain = Blockchain;
