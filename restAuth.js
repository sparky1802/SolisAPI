import { crypto } from "@std/crypto"
import { encodeBase64 } from "@std/encoding/base64"

export { authMessage, digestMessage, keySign, messageToSign };

const utf8Encoder = new TextEncoder('utf-8');

//Sign the "MESSAGE" using the key "keySign"
async function authMessage(SIGN_ALGORITHM, SIGN_KEY, MESSAGE) {
	let resAuth = await crypto.subtle.sign(
		SIGN_ALGORITHM,
		SIGN_KEY,
		MESSAGE,
	);
	resAuth = encodeBase64(resAuth, 'base64');
	return resAuth;
}

//Hash "CONTENT" with MD5 and convert to base64
async function digestMessage(CONTENT_HASH, CONTENT) {
	let resCont = utf8Encoder.encode(CONTENT);
	resCont = await crypto.subtle.digest(CONTENT_HASH, resCont);
	resCont = encodeBase64(resCont, 'base64');
	return resCont;
}

//Create a key "keySign" used to sign "MESSAGE"
async function keySign(KEY_SECRET, SIGN_FORMAT, SIGN_ALGORITHM, SIGN_HASH) {
	KEY_SECRET = utf8Encoder.encode(KEY_SECRET);
	const resKeySec = await crypto.subtle.importKey(
		SIGN_FORMAT,
		KEY_SECRET,
		{ name: SIGN_ALGORITHM, hash: SIGN_HASH },
		false,
		['sign', 'verify'],
	);
	return resKeySec;
}

//Create a MESSAGE for Signing and encode as utf-8
function messageToSign(
	HTTP_VERB,
	CONTENT_MD5,
	CONTENT_TYPE,
	GMT_DATE,
	canonicalizedResources,
) {
	let resMessage = HTTP_VERB + '\n' +
		CONTENT_MD5 + '\n' +
		CONTENT_TYPE + '\n' +
		GMT_DATE + '\n' +
		canonicalizedResources;
	resMessage = utf8Encoder.encode(resMessage);
	return resMessage;
}
