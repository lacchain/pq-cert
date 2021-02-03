import express from 'express';

export default class Router {

	constructor() {
		this.router = express.Router();
		this.init();
	}

	init() {
	}

	get( path, ...callbacks ) {
		this.router.get( path, this._bindCustomResponses, this._getCallbacks( callbacks ) );
	}

	post( path, ...callbacks ) {
		this.router.post( path, this._bindCustomResponses, this._getCallbacks( callbacks ) );
	}

	getRouter() {
		return this.router;
	}

	_getCallbacks( callbacks ) {
		return callbacks.map( ( callback ) => async( ...params ) => {
			try {
				const response = await callback.apply( this, params )
				params[1].sendSuccess( response );
			} catch( error ) {
				params[1].sendError( error + '' );
			}
		} );
	}

	_bindCustomResponses( req, res, next ) {
		res.sendSuccess = ( payload ) => {
			res.status( 200 ).json( payload );
		};
		res.sendError = ( error ) => {
			res.status( 500 ).json( error );
		};
		next();
	}
}