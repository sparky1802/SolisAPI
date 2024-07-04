import { crypto } from "https://deno.land/std@0.193.0/crypto/mod.ts";
import { toHashString } from "https://deno.land/std@0.193.0/crypto/to_hash_string.ts";

export { authMessage, digestMessage, keySign, messageToSign };

const utf8Encoder = new TextEncoder("utf-8");

//Sign the "message" using the key "keySign"
async function authMessage(signAlgorithm, signKey, message) {
  let resAuth = await crypto.subtle.sign(
    signAlgorithm,
    signKey,
    message,
  );
  resAuth = toHashString(resAuth, "base64");
  return resAuth;
}

//Hash "content" with MD5 and convert to base64
async function digestMessage(contentHash, content) {
  let resCont = utf8Encoder.encode(content);
  resCont = await crypto.subtle.digest(contentHash, resCont);
  resCont = toHashString(resCont, "base64");
  return resCont;
}

//Create a key "keySign" used to sign "message"
async function keySign(keySecret, signFormat, signAlgorithm, signHash) {
  keySecret = utf8Encoder.encode(keySecret);
  const resKeySec = await crypto.subtle.importKey(
    signFormat,
    keySecret,
    { name: signAlgorithm, hash: signHash },
    false,
    ["sign", "verify"],
  );
  return resKeySec;
}

//Create a Message for Signing and encode as utf-8
function messageToSign(
  httpVerb,
  contentMD5,
  contentType,
  gmtDate,
  canonicalizedResources,
) {
  let resMessage = httpVerb + "\n" +
    contentMD5 + "\n" +
    contentType + "\n" +
    gmtDate + "\n" +
    canonicalizedResources;
  resMessage = utf8Encoder.encode(resMessage);
  return resMessage;
}
