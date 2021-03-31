/*
 *  The Block class is a main component in the Blockchain platform,
 *  storing the data and acting as a dataset for an application.
 *  The class exposes a method to validate the data. The body of
 *  the block will contain an Object that contains the data to be stored,
 *  the data should be stored encoded.
 *  All the exposed methods should return a Promise to allow all the methods
 *  to run asynchronously.
 */

const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii');

class Block {
	//* Constructor - argument data will be the object containing the transaction data
	constructor(data) {
		this.hash = null; // Hash of the block
		this.height = 0; // Block Height (consecutive number of each block)
		this.body = Buffer(JSON.stringify(data)).toString('hex'); // contains the transactions stored in the block, by default it will encode the data
		this.time = 0; // Timestamp for the Block creation
		this.previousBlockHash = null; // Reference to the previous Block Hash
	}

	/*
	 *  validate() method will validate if the block has been tampered with.
	 *  'Tampered with' means that someone from outside the application tried to change
	 *  values in the block data and as a consequence, the hash of the block should be different.
	 *
	 *  Steps:
	 *  ------
	 *  1. Return a new promise to allow the method to be called asynchronously.
	 *  2. Create an auxiliary variable and store the current hash of the block in it ('this' represents the block object)
	 *  3. Recalculate the hash of the entire block (Use SHA256 from crypto-js library)
	 *  4. Compare if the auxiliary hash value is different from the calculated one.
	 *  5. Resolve true or false depending if it is valid or not.
	 *
	 *  Note: to access the class values inside a Promise, create an auxiliary value 'let self = this'
	 */

	validate() {
		let self = this;
		return new Promise(async (resolve, reject) => {
			// Save in auxiliary variable the current block hash
			const hash = self.hash;
			// Recalculate the hash of the Block
			// Compare if the hashes have changed
			// Returning whether Block is or is not valid

			self.hash = await SHA256(
				JSON.stringify({ ...self, hash: null })
			).toString();

			resolve(hash === self.hash);
		});
	}

	/*
     *  Method to return the block body (decoding the data)
     
	 *  Steps:
	 *  ------
	 *  1. Use hex2ascii module to decode the data
	 *  2. Use JSON.parse(string) to get the Javascript Object
	 *  3. Resolve with the data making if not the 'genesis block' else Reject with an error.
	 */
	getBData() {
		let self = this;
		return new Promise((resolve, reject) => {
			// Getting the encoded data saved in the Block
			const hexEncodedString = self.body;
			// Decoding the data to retrieve the JSON representation of the object
			const decodedString = hex2ascii(hexEncodedString);
			// Parse the data to an object to be retrieved
			const decodedObject = JSON.parse(decodedString);
			// Resolve with the data if the object isn't the Genesis block
			self.height > 0
				? resolve(decodedObject)
				: reject(new Error('Genesis Block'));
		});
	}
}

module.exports.Block = Block; // Exposing the Block class as a module
