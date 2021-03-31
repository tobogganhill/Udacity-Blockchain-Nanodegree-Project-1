/*
 TODO:       BlockchainController
 TODO:       (Do not change this code)
 *
 * This class exposes the endpoints that the client applications
 * will use to interact with the Blockchain dataset
 */

class BlockchainController {
	// The constructor receives the instance of the express.js app and the Blockchain class.
	constructor(app, blockchainObj) {
		this.app = app;
		this.blockchain = blockchainObj;
		// All the endpoint methods need to be called in the constructor to initialize the route.
		this.getBlockByHeight();
		this.requestOwnership();
		this.submitStar();
		this.getBlockByHash();
		this.testChainValidation();
		this.getStarsByOwner();
	}

	// Enpoint to Get a Block by Height (GET Endpoint)
	getBlockByHeight() {
		this.app.get('/block/height/:height', async (req, res) => {
			if (req.params.height) {
				const height = parseInt(req.params.height);
				let block = await this.blockchain.getBlockByHeight(height);
				if (block) {
					return res.status(200).json(block);
				} else {
					return res.status(404).send('Block not found!');
				}
			} else {
				return res
					.status(404)
					.send('Block not found. Check the block height parameter.');
			}
		});
	}

	// Endpoint that allows user to request Ownership of a Wallet address (POST Endpoint)
	requestOwnership() {
		this.app.post('/requestOwnership', async (req, res) => {
			if (req.body.address) {
				const address = req.body.address;
				const message = await this.blockchain.requestMessageOwnershipVerification(
					address
				);
				if (message) {
					return res.status(200).json(message);
				} else {
					return res.status(500).send('Error in function requestOwnership.');
				}
			} else {
				return res.status(500).send('Check the body parameter.');
			}
		});
	}

	// Endpoint to Submit a Star
	// First must `requestOwnership` to have the message (POST endpoint)
	submitStar() {
		this.app.post('/submitstar', async (req, res) => {
			if (
				req.body.address &&
				req.body.message &&
				req.body.signature &&
				req.body.star
			) {
				const address = req.body.address;
				const message = req.body.message;
				const signature = req.body.signature;
				const star = req.body.star;
				try {
					let block = await this.blockchain.submitStar(
						address,
						message,
						signature,
						star
					);
					if (block) {
						return res.status(200).json(block);
					} else {
						return res.status(500).send('Error in function submitStar.');
					}
				} catch (error) {
					return res.status(500).send(error);
				}
			} else {
				return res.status(500).send('Check the Body parameter.');
			}
		});
	}

	// This endpoint allows retrieval of the block by hash (GET endpoint)
	getBlockByHash() {
		this.app.get('/block/hash/:hash', async (req, res) => {
			if (req.params.hash) {
				const hash = req.params.hash;
				let block = await this.blockchain.getBlockByHash(hash);
				if (block) {
					return res.status(200).json(block);
				} else {
					return res.status(404).send('Block not found.');
				}
			} else {
				return res.status(404).send('Block not found. Check hash.');
			}
		});
	}

	// Endpoint to call validateChain() (GET endpoint)
	// assumes that a blockchain exists
	testChainValidation() {
		this.app.get('/testChainValidation', async (req, res) => {
			try {
				await this.blockchain.validateChain();
				return res.status(200).send('Blockchain valid.');
			} catch (error) {
				return res.status(500).send('Error in function testChainValidation.');
			}
		});
	}

	// Endpoint to request list of Stars registered by an owner
	getStarsByOwner() {
		this.app.get('/blocks/:address', async (req, res) => {
			if (req.params.address) {
				const address = req.params.address;
				try {
					let stars = await this.blockchain.getStarsByWalletAddress(address);
					if (stars) {
						return res.status(200).json(stars);
					} else {
						return res.status(404).send('Block not found.');
					}
				} catch (error) {
					return res.status(500).send('Error in function getStarsByOwner.');
				}
			} else {
				return res.status(500).send('Block not found. Check address.');
			}
		});
	}
}

module.exports = (app, blockchainObj) => {
	return new BlockchainController(app, blockchainObj);
};
