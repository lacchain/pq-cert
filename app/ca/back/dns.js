import Web3 from 'web3'
import ethTx from "ethereumjs-tx"
import config from "./config.js";

export default async function( address, pem ){
	const web3 = new Web3( process.env.WEB3_RPC, {
		network_id: process.env.NETWORK_ID,
		gas: 0,
		gasPrice: 0
	} );
	web3.currentProvider.sendAsync = web3.currentProvider.send;

	const contract = new web3.eth.Contract( config.DNS_ABI, process.env.DNS_REGISTRY );
	const data = await contract.methods.addDID( address, pem );
	console.log( 'data', data );
	const txCount = await web3.eth.getTransactionCount( process.env.DNS_ADMIN_ADDRESS );
	console.log( 'txCount', txCount );
	const transaction = new ethTx( {
		nonce: web3.utils.toHex( txCount ),
		gasLimit: web3.utils.toHex( 12084908 ),
		gasPrice: web3.utils.toHex( 0 ),
		to: process.env.DNS_REGISTRY,
		data: data.encodeABI()
	} )
	console.log( 'transaction', transaction );
	transaction.sign( Buffer.from( process.env.DNS_ADMIN_PRIVATE_KEY, 'hex' ) )
	const serializedTx = transaction.serialize().toString( 'hex' )
	return web3.eth.sendSignedTransaction( `0x${serializedTx}` );
}