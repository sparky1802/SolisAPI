import {
	authMessage,
	digestMessage,
	keySign,
	messageToSign,
} from './messageSign.js';
import { sleep } from './dateTime.js';

export { fetchData };

const CONTENT_HASH = 'MD5';
const CONTENT_TYPE = 'application/json';
const GMT_DATE = new Date().toUTCString();
const HOST_PROTOCOL = 'https';
const HOST_NAME = 'soliscloud.com';
const SERVICE_PORT = '13333';
const HOST_ID = `${HOST_PROTOCOL}://${HOST_NAME}:${SERVICE_PORT}`;
const HTTP_VERB = 'POST';
const SIGN_ALGORITHM = 'HMAC';
const SIGN_FORMAT = 'raw';
const SIGN_HASH = 'SHA-1';

//CREATE THE API REQUEST TO POST AND FETCH THE DATA IN JSON.STRINGIFY FORMAT
async function fetchData(CANONICALIZED_RESOURCE, CONTENT, KEY_ID, KEY_SECRET) {
	//Create the API request to post
	const CONTENT_MD5 = await digestMessage(CONTENT_HASH, CONTENT);
	const MESSAGE = await messageToSign(
		HTTP_VERB,
		CONTENT_MD5,
		CONTENT_TYPE,
		GMT_DATE,
		CANONICALIZED_RESOURCE,
	);
	const SIGN_KEY = await keySign(
		KEY_SECRET,
		SIGN_FORMAT,
		SIGN_ALGORITHM,
		SIGN_HASH,
	);
	const AUTH_KEY = await authMessage(SIGN_ALGORITHM, SIGN_KEY, MESSAGE);
	const AUTHORIZATION = `API ${KEY_ID}:${AUTH_KEY}`;
	const REQUEST_OPTIONS = {
		method: HTTP_VERB,
		url: `${HOST_ID}${CANONICALIZED_RESOURCE}`,
		headers: {
			'CONTENT-MD5': CONTENT_MD5,
			'CONTENT-Type': CONTENT_TYPE,
			'Date': GMT_DATE,
			'AUTHORIZATION': AUTHORIZATION,
		},
		body: CONTENT,
	};
	//Fetch the data
	try {
		const RESPONSE = await fetch(
			`${HOST_ID}${CANONICALIZED_RESOURCE}?${AUTHORIZATION}`,
			REQUEST_OPTIONS,
		);
		const DATA = await RESPONSE.json();
		await sleep(501);
		return JSON.stringify(DATA);
	} catch (error) {
		return error.toString();
	}
}
