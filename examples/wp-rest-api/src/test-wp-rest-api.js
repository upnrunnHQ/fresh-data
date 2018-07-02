import { startsWith } from 'lodash';
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

		static operations = {
			read: ( { get } ) => ( resourceNames ) => {
				return readPostPages( get, resourceNames );
			},
		}

		static selectors = {
			getPosts: ( getData, requireData ) => ( requirement, page = 1, perPage = 10 ) => {
				const resourceName = `posts-page:{"page":${ page },"perPage":${ perPage }}`;
				requireData( requirement, resourceName );
				const pageIds = getData( resourceName ) || [];
				const pagePosts = pageIds.map( id => getData( `post:${ id }` ) ) || {};
				return pagePosts;
			}
		}
	}
	return TestWPRestApi;
}

export function readPostPages( get, resourceNames ) {
	const requests = [];
	resourceNames.forEach( resourceName => {
		if ( startsWith( resourceName, 'posts-page:' ) ) {
			const params = JSON.parse( resourceName.substr( resourceName.indexOf( ':' ) + 1 ) );

			// Do a get for each page.
			const request = get( [ 'posts' ] )( params )
			.then( responseData => {
				// Store each post separately so it can be used by the rest of the app.
				const postsById = responseData.reduce( ( posts, data ) => {
					posts[ `post:${ data.id }` ] = { data };
					return posts;
				}, {} );

				// Store the page as a list of ids so we don't duplicate data.
				const pageData = responseData.map( post => post.id );

				const resources = { ...postsById, [ resourceName ]: { data: pageData } };
				return resources;
			} )
			.catch( error => {
				// Only place error on the page resource.
				return { [ resourceName ]: { error } };
			} );
			requests.push( request );
		}
	} );
	return requests;
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
