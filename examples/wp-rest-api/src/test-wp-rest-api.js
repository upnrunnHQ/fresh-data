import { FreshDataApi } from 'fresh-data';
import qs from 'qs';

const NAMESPACE = 'wp/v2';
const API_URL_PREFIX = `wp-json/${ NAMESPACE }`;

export function createApi( fetch = window.fetch ) {
	class TestWPRestApi extends FreshDataApi {
		static methods = {
			get: ( clientKey ) => ( endpointPath ) => ( params ) => { // eslint-disable-line no-unused-vars
				const baseUrl = `${ clientKey }/${ API_URL_PREFIX }`;
				const path = endpointPath.join( '/' );
				const httpParams = { page: params.page, per_page: params.perPage }; // eslint-disable-line camelcase
				const url = `${ baseUrl }/${ path }${ httpParams ? '?' + qs.stringify( httpParams ) : '' }`;

				return fetch( url ).then( ( response ) => {
					if ( ! response.ok ) {
						throw new Error( `HTTP Error for ${ response.url }: ${ response.status }` );
					}
					return response.json().then( ( data ) => {
						return data;
					} );
				} );
			},
		}

		static endpoints = {
			posts: {
				read: ( methods, endpointPath, params ) => {
					const { get } = methods;
					const fullEndpointPath = [ 'posts', ...endpointPath ];
					const value = get( fullEndpointPath )( params );
					return value;
				},
			},
		}

		static selectors = {
			getPosts: ( getData, requireData ) => ( requirement, page = 1, perPage = 10 ) => {
				const path = [ 'posts' ];
				const params = { page, perPage };
				requireData( requirement, path, params );
				return getData( path, params ) || [];
			}
		}
	}
	return TestWPRestApi;
}

export function verifySiteUrl( siteUrl, fetch = window.fetch ) {
	const apiUrl = `${ siteUrl }/${ API_URL_PREFIX }`;

	return fetch( apiUrl ).then( ( response ) => {
		if ( ! response.ok ) {
			throw new Error( `Invalid Site URL: ${ response.url } Status: ${ response.status }` );
		}

		return response.json().then( ( data ) => {
			if ( NAMESPACE !== data.namespace ) {
				throw new Error( `Expected namespace ${ NAMESPACE } but received ${ data.namespace }` );
			}
			const postRoute = `/${ NAMESPACE }/posts`;
			const posts = data.routes[ postRoute ];
			if ( ! posts ) {
				throw new Error( `No route for posts found at ${ postRoute }` );
			}
			// It all checks out. We're good to go.
			return true;
		} );
	} );
}

export default createApi();