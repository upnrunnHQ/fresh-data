import {
	FRESH_DATA_CLIENT_RECEIVED,
	FRESH_DATA_CLIENT_REQUESTED,
} from './action-types';

export function dataRequested( apiName, clientKey, resourceNames, time = new Date() ) {
	return {
		type: FRESH_DATA_CLIENT_REQUESTED,
		apiName,
		clientKey,
		resourceNames,
		time,
	};
}

export function dataReceived( apiName, clientKey, resources, time = new Date() ) {
	return {
		type: FRESH_DATA_CLIENT_RECEIVED,
		apiName,
		clientKey,
		resources,
		time,
	};
}
