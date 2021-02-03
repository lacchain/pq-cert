import fs from 'fs';
import https from 'https';
import axios from 'axios';
import { exec } from 'child_process';
import Router from './router.js';
import publicKeyToAddress from "ethereum-public-key-to-address";

export default class APIRouter extends Router {

	constructor() {
		super();
	}

	init() {
		const httpsAgent = new https.Agent( {
			rejectUnauthorized: false,
			cert: fs.readFileSync( "/certs/client.crt" ),
			key: fs.readFileSync( "/certs/client.key" )
		} );

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
			}, { httpsAgent } );
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
			const { subject, quantum, auto, publicKey, privateKey } = req.body;

			if( quantum ) {
				await this.execute( "openssl genpkey -algorithm falcon512 -out /quantum.key" );
				await this.execute( `openssl req -new -key ./quantum.key -out /quantum.csr -config /usr/lib/ssl/demo_openssl.cnf -subj ${subject}` );
			}
			if( auto ) {
				await this.execute( `openssl ecparam -name secp256k1 -genkey -noout > /ethereum.key && \\
										openssl ec -text -noout < /ethereum.key > key && \\
										cat key | grep pub -A 5 | tail -n +2 | tr -d '\\n[:space:]:' | sed 's/^04//' > /ethereum.pub && \\
										cat key | grep priv -A 3 | tail -n +2 | tr -d '\\n[:space:]:' | sed 's/^00//' > /ethereum.priv && \\
										openssl req -new -key /ethereum.key -out /ethereum.csr -config /usr/lib/ssl/demo_openssl.cnf -subj "${subject}"` );
			} else {
				fs.writeFileSync('/ethereum.asn1', `asn1 = SEQUENCE:seq_section
										[seq_section]
										version = INTEGER:01
										privateKey = FORMAT:HEX,OCT:${privateKey}
										parameters = EXPLICIT:0,OID:secp256k1
										publicKey  = EXPLICIT:1,FORMAT:HEX,BITSTR:${publicKey}"` );
				await this.execute( `openssl asn1parse -noout -genconf /ethereum.asn1 -out /ethereum.der && \\
										openssl ec -inform DER -in /ethereum.der -out /ethereum.key && \\
										openssl req -new -key /ethereum.key -out /ethereum.csr -config /usr/lib/ssl/demo_openssl.cnf -subj "${subject}"` );
			}
			const quantumPk = await this.execute( "openssl req -in /quantum.csr -noout -pubkey | openssl pkey -pubin -noout -text | grep pub -A 5 | tail -n +2 | tr -d '\\n[:space:]:'" );
			return {
				quantum: {
					key: fs.readFileSync( '/quantum.key' ).toString(),
					csr: fs.readFileSync( '/quantum.csr' ).toString(),
					pub: quantumPk
				},
				ethereum: {
					key: fs.readFileSync( '/ethereum.key' ).toString(),
					csr: fs.readFileSync( '/ethereum.csr' ).toString(),
					pub: auto ? fs.readFileSync( '/ethereum.pub' ).toString() : '',
					priv: auto ? fs.readFileSync( '/ethereum.priv' ).toString() : '',
					addr: publicKeyToAddress( `04${fs.readFileSync( '/ethereum.pub' ).toString()}` )
				}
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