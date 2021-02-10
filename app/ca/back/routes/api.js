import fs from 'fs';
import https from 'https';
import axios from 'axios';
import { exec } from 'child_process';
import Router from './router.js';
import moment from 'moment';
import generateDID from '../did.js';
import registerDNS from '../dns.js';

export default class APIRouter extends Router {

	constructor() {
		super();
	}

	init() {
		/*const httpsAgent = new https.Agent( {
			rejectUnauthorized: false,
			cert: fs.readFileSync( "/certs/client.crt" ),
			key: fs.readFileSync( "/certs/client.key" )
		} );*/

		this.get( '/test', async () => {
			return await this.execute( "openssl rand -engine ibrand 24" );
		});

		this.get( '/setup', async req => {
			const { emails } = req.query;
			const serial = await this.execute( "openssl x509 -noout -serial -in /certs/client.crt | cut -d'=' -f2" );
			const result = await axios.post( "https://pqe-rpc-server/api/clientsetupdata", {
				clientCertName: "monarca.iadb.org",
				clientCertSerialNumber: serial.trim(),
				countryCode: "GB",
				channels: emails.split(',').map( email => ({
					type: "email",
					value: email
				}) ),
				kemAlgorithm: "222"
			} );
			const data = JSON.stringify( result.data, null, 2 );
			fs.writeFileSync( '/oob/ironbridge_clientsetup_OOB_1.json', JSON.stringify( result.data ) );
			return data;
		} );

		this.post( '/setup', async req => {
			const { segments } = req.body;
			segments.forEach( (slice, index) => {
				fs.writeFileSync( `/oob/ironbridge_clientsetup_OOB_${index + 2}.json`, slice );
			});
			return await this.execute( "sh /setup.sh" );
		} );

		this.post( '/', async req => {
			const { x509, pqcsr, ethcsr, expires } = req.body;

			fs.writeFileSync( '/x509.crt', x509 );
			fs.writeFileSync( '/pq.csr', pqcsr );
			fs.writeFileSync( '/eth.csr', ethcsr );

			const x509_subject = await this.execute( "openssl x509 -noout -in /x509.crt -subject | sed 's/subject=//'" );
			const pqcsr_subject = await this.execute( "openssl req -noout -in /pq.csr -subject | sed 's/subject=//'" );
			const ethcsr_subject = await this.execute( "openssl req -noout -in /eth.csr -subject | sed 's/subject=//'" );

			if( moment( expires ).isBefore( moment() ) )
				return { error: 'The expiration date must be after today' }
			console.log( 'X.509 subject:', x509_subject );
			console.log( 'PQ subject:', pqcsr_subject );
			console.log( 'Eth subject:', ethcsr_subject );
			if( !( x509_subject === pqcsr_subject && pqcsr_subject === ethcsr_subject ) )
				return { error: 'The subject of certificates is not the same' }

			const ethereum_key = await this.execute( "openssl req -noout -in /eth.csr -pubkey | openssl pkey -inform PEM -pubin -text -noout | grep pub -A 5 | tail -n +2 | tr -d '\\n    ' | sed 's/^04//'" );
			fs.writeFileSync( '/ethereum.conf', `[v3_req]
1.3.132.0.10=ASN1:UTF8String:secp256k1
1.2.840.10045.2.1=ASN1:UTF8String:EcPublicKey
1.3.6.1.3.0.2.1.5=ASN1:BITSTRING:04${ethereum_key}
` );

			const days = moment( expires ).diff( moment(), 'days' );
			await this.execute( `openssl x509 -req -in /pq.csr -CA /out/ca/ca.crt -CAkey /out/ca/ca.key -CAcreateserial -days ${days} -extfile ethereum.conf -extensions v3_req > /applicant.crt` );

			const quantumPEM = fs.readFileSync( '/applicant.crt' ).toString();
			const { address, did, publicKeyHex } = await generateDID( quantumPEM );
			console.log( address, did, publicKeyHex );
			const dnsTx = await registerDNS( address, quantumPEM );
			return {
				crt: quantumPEM,
				did, publicKeyHex,
				dnsTx: dnsTx.transactionHash
			};
		} );

	}

	async execute( cmd ) {
		return new Promise( ( resolve, reject ) => {
			exec( cmd, ( error, stdout, stderr ) => {
				if( error ) return reject( error );
				if( stderr ) return resolve( stderr );
				resolve( stdout );
			} );
		} );

	}

}