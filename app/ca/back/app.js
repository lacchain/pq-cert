import express from 'express';
import http from 'http';
import cors from 'cors';
import APIRouter from "./routes/api.js";
import config from "./config.js";

const app = express();

const apiRouter = new APIRouter();

app.use( cors() );
app.use( express.json() );
app.use( express.urlencoded( { extended: false } ) );

app.use( function( req, res, next ) {
	res.setHeader( 'Strict-Transport-Security', 'max-age=15724800; includeSubDomains' );
	next();
} );

app.use( '/api', apiRouter.getRouter() );
app.use( express.static('/app/public') );

const server = http.createServer( app );

server.listen( config.APP_PORT, () => {
	console.log( 'LACChain PQ Applicant v1.0 | Port: ', config.APP_PORT );
} );