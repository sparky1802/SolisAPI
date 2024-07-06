import { crypto } from 'https://deno.land/std@0.193.0/crypto/mod.ts';
import { toHashString } from 'https://deno.land/std@0.193.0/crypto/to_hash_string.ts';

export { authMessage, digestMessage, keySign, messageToSign };

const utf8Encoder = new TextEncoder('utf-8');

//Sign the "MESSAGE" using the key "keySign"
async function authMessage(SIGN_ALGORITHM, SIGN_KEY, MESSAGE) {
	let resAuth = await crypto.subtle.sign(
		SIGN_ALGORITHM,
		SIGN_KEY,
		MESSAGE,
	);
	resAuth = toHashString(resAuth, 'base64');
	return resAuth;
}

//Hash "CONTENT" with MD5 and convert to base64
async function digestMessage(CONTENT_HASH, CONTENT) {
	let resCont = utf8Encoder.encode(CONTENT);
	resCont = await crypto.subtle.digest(CONTENT_HASH, resCont);
	resCont = toHashString(resCont, 'base64');
	return resCont;
}

//Create a key "keySign" used to sign "MESSAGE"
async function keySign(keySecret, SIGN_FORMAT, SIGN_ALGORITHM, SIGN_HASH) {
	keySecret = utf8Encoder.encode(keySecret);
	const resKeySec = await crypto.subtle.importKey(
		SIGN_FORMAT,
		keySecret,
		{ name: SIGN_ALGORITHM, hash: SIGN_HASH },
		false,
		['sign', 'verify'],
	);
	return resKeySec;
}

//Create a MESSAGE for Signing and encode as utf-8
function messageToSign(
	HTTP_VERB,
	CONTENT_md5,
	CONTENT_TYPE,
	GMT_DATE,
	canonicalizedResources,
) {
	let resMessage = HTTP_VERB + '\n' +
		CONTENT_md5 + '\n' +
		CONTENT_TYPE + '\n' +
		GMT_DATE + '\n' +
		canonicalizedResources;
	resMessage = utf8Encoder.encode(resMessage);
	return resMessage;
}
