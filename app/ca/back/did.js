import Web3 from 'web3'
import HttpProvider from 'ethjs-provider-http'
import Eth from 'ethjs-query'
import EthContract from 'ethjs-contract'
import DidRegistryContract from 'ethr-did-resolver/contracts/ethr-did-registry.json'
import edr from 'ethr-did-resolver'
import jwt from 'did-jwt'
import elliptic from "elliptic"
import ethutils from "ethereumjs-util"
import EthUtil from "ethereumjs-util"
import ethTx from "ethereumjs-tx"
import x509 from "@fidm/x509"
import Wallet from "ethereumjs-wallet";

const secp256k1 = new elliptic.ec( 'secp256k1' )

function toEthereumAddress( hexPublicKey ) {
	return `0x${ethutils.keccak( Buffer.from( hexPublicKey.slice( 2 ), 'hex' ) )
		.slice( -20 )
		.toString( 'hex' )}`
}

function configureProvider( conf = {} ) {
	if( conf.provider ) {
		return conf.provider
	}
	if( conf.web3 ) {
		return conf.web3.currentProvider
	}
	return new HttpProvider( conf.rpcUrl || 'https://mainnet.infura.io/ethr-did' )
}

function attributeToHex( key, value ) {
	if( Buffer.isBuffer( value ) ) {
		return `0x${value.toString( 'hex' )}`
	}
	const match = key.match( /^did\/(pub|auth|svc)\/(\w+)(\/(\w+))?(\/(\w+))?$/ )
	if( match ) {
		const encoding = match[6]
		if( encoding === 'base64' ) {
			return `0x${Buffer.from( value, 'base64' ).toString( 'hex' )}`
		}
	}
	if( value.match( /^0x[0-9a-fA-F]*$/ ) ) {
		return value
	}
	return `0x${Buffer.from( value ).toString( 'hex' )}`
}

function getAddress( certificate ) {
	let publicKey = Buffer.from( certificate.publicKeyRaw ).toString( 'hex' ).slice( -128 );
	try {
		const { extensions } = certificate;
		console.log('Extensions', extensions);
		if( extensions.length > 0 ) {
			const pkHex = Buffer.from( extensions[2].value ).toString().substr( 6 );
			publicKey = pkHex.split(':').join('');
			console.log('Extension[2]', pkHex, `0x${publicKey}` );
		}
		const publicKeyBuffer = EthUtil.toBuffer( `0x${publicKey}` );
		const wallet = Wallet.default.fromPublicKey( publicKeyBuffer );
		return `0x${wallet.getAddress().toString( 'hex' )}`;
	} catch( e ) {
		console.error( e );
		return null;
	}
}

class EthrDID {
	constructor( conf = {} ) {
		const provider = configureProvider( conf )
		const eth = new Eth( provider )
		const registryAddress = conf.registry || edr.REGISTRY
		const DidReg = new EthContract( eth )( DidRegistryContract )
		this.registry = DidReg.at( registryAddress )
		this.address = conf.address
		this.registryAddress = conf.registry;
		if( !this.address ) throw new Error( 'No address is set for EthrDid' )
		this.did = `did:ethr:lacchain:${this.address}`
		if( conf.signer ) {
			this.signer = conf.signer
		} else if( conf.privateKey ) {
			this.signer = jwt.SimpleSigner( conf.privateKey )
		}
		this.privateKey = conf.privateKey;
		this.provider = provider;
		this.web3 = conf.web3;
		this.contract = new conf.web3.eth.Contract( DidRegistryContract, registryAddress );
	}

	static createKeyPair() {
		const kp = secp256k1.genKeyPair()
		const publicKey = kp.getPublic( 'hex' )
		const privateKey = kp.getPrivate( 'hex' )
		const address = toEthereumAddress( publicKey )
		return { address, publicKey, privateKey }
	}

	async lookupOwner( cache = true ) {
		if( cache && this.owner ) return this.owner
		const result = await this.registry.identityOwner( this.address )
		return result['0']
	}

	async changeOwner( newOwner ) {
		const owner = await this.lookupOwner()
		const data = await this.contract.methods.changeOwner( owner, newOwner )
		const txCount = await this.web3.eth.getTransactionCount( owner );
		const transaction = new ethTx( {
			nonce: this.web3.utils.toHex( txCount ),
			gasLimit: this.web3.utils.toHex( 284908 ),
			gasPrice: this.web3.utils.toHex( 0 ),
			to: this.registryAddress,
			data: data.encodeABI()
		} )
		transaction.sign( Buffer.from( this.privateKey, 'hex' ) )
		const serializedTx = transaction.serialize().toString( 'hex' )
		this.owner = newOwner
		return this.web3.eth.sendSignedTransaction( `0x${serializedTx}` );
	}

	async setAttribute( key, value, expiresIn = 31536000 ) {
		const owner = await this.lookupOwner();
		const data = this.contract.methods.setAttribute( owner,
			edr.stringToBytes32( key ),
			attributeToHex( key, value ),
			expiresIn
		);
		const txCount = await this.web3.eth.getTransactionCount( owner )
		const transaction = new ethTx( {
			nonce: this.web3.utils.toHex( txCount ),
			gasLimit: this.web3.utils.toHex( 284908 ),
			gasPrice: this.web3.utils.toHex( 0 ),
			to: this.registryAddress,
			data: data.encodeABI()
		} )
		transaction.sign( Buffer.from( this.privateKey, 'hex' ) )
		const serializedTx = transaction.serialize().toString( 'hex' )
		return await this.web3.eth.sendSignedTransaction( '0x' + serializedTx )
	}

}

export default async function( pem ) {
	const web3 = new Web3( process.env.WEB3_RPC, {
		network_id: process.env.NETWORK_ID,
		gas: 0,
		gasPrice: 0
	} );
	web3.currentProvider.sendAsync = web3.currentProvider.send;

	const keyPair = EthrDID.createKeyPair()
	const ethrDid = new EthrDID( {
		...keyPair,
		provider: web3.currentProvider,
		registry: process.env.ETHR_REGISTRY,
		web3
	} );
	const certificate = x509.Certificate.fromPEM( pem );
	const address = getAddress( certificate );
	console.log( 'Original address:', address );
	const did = `did:ethr:lacchain:${keyPair.address}`;
	console.log( 'Generating DID:', did );
	const publicKeyHex = Buffer.from( certificate.publicKeyRaw ).toString( 'hex' );
	//console.log( 'Adding public key:', publicKeyHex );
	//await ethrDid.setAttribute( 'did/pub/falcon512/veriKey/hex', publicKeyHex );
	console.log( 'Changing to owner:', address );
	await ethrDid.changeOwner( address );
	console.log( 'Done!' );
	return {
		address,
		did,
		publicKeyHex
	};
}