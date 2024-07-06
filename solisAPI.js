import {
	authMessage,
	digestMessage,
	keySign,
	messageToSign,
} from './restAuth.js';
import { addDay, numOfDays, sleep } from './dateTime.js';

export {
	collectorDetail,
	collectorList,
	daily5min,
	inverterDetail,
	inverterList,
	stationDetail,
	stationList,
};

const CONTENT_HASH = 'MD5';
const CONTENT_TYPE = 'application/json';
const GMT_DATE = new Date().toUTCString();
const HOST_ID = 'https://soliscloud.com:13333';
const HTTP_VERB = 'POST';
const SIGN_ALGORITHM = 'HMAC';
const SIGN_FORMAT = 'raw';
const SIGN_HASH = 'SHA-1';

//CREATE THE API REQUEST TO POST AND FETCH THE DATA IN JSON.STRINGIFY FORMAT
async function getDetails(CANONICALIZED_RESOURCE, CONTENT, keyID, keySecret) {
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
		keySecret,
		SIGN_FORMAT,
		SIGN_ALGORITHM,
		SIGN_HASH,
	);
	const AUTH_KEY = await authMessage(SIGN_ALGORITHM, SIGN_KEY, MESSAGE);
	const AUTHORIZATION = `API ${keyID}:${AUTH_KEY}`;
	const REQUEST_OPTIONS = {
		method: HTTP_VERB,
		url: HOST_ID + CANONICALIZED_RESOURCE,
		headers: {
			'CONTENT-MD5': CONTENT_MD5,
			'CONTENT-Type': CONTENT_TYPE,
			'Date': GMT_DATE,
			'AUTHORIZATION': AUTHORIZATION,
		},
		body: CONTENT,
	};
	//Fetch the data
	const resultResponse = await fetch(
		HOST_ID + CANONICALIZED_RESOURCE + '?' + AUTHORIZATION,
		REQUEST_OPTIONS,
	)
		.then((response) => {
			return response.json();
		})
		.then((response) => {
			return JSON.stringify(response);
		})
		.catch((error) => {
			return error;
		});
	await sleep(1667);
	return resultResponse;
}

//POWER STATION LIST (ALL)
async function stationList(keyID, keySecret) {
	const CANONICALIZED_RESOURCE = '/v1/api/userStationList';
	const CONTENT = `{"pageNo":1,"pageSize":20}`;
	const DETAILS = await getDetails(
		CANONICALIZED_RESOURCE,
		CONTENT,
		keyID,
		keySecret,
	);
	return JSON.parse(DETAILS);
}

//POWER DETAIL (INDIVIDUAL)
async function stationDetail(keyID, keySecret) {
	const JSON_LIST = await stationList(keyID, keySecret);
	const DEVICE_QUANTITY = JSON_LIST.data.page.total;
	const RESULT_ARRAY = [];
	for (let index = 0; index < DEVICE_QUANTITY; index++) {
		const DEVICE_ID = JSON_LIST.data.page.records[index].id;
		const CANONICALIZED_RESOURCE = '/v1/api/stationDetail';
		const CONTENT = `{"id":${DEVICE_ID}}`;
		const DETAILS = await getDetails(
			CANONICALIZED_RESOURCE,
			CONTENT,
			keyID,
			keySecret,
		);
		RESULT_ARRAY.push(JSON.parse(DETAILS));
	}
	return RESULT_ARRAY;
}

//COLLECTOR / DATALOGGER LIST (ALL)
async function collectorList(keyID, keySecret) {
	const JSON_LIST = await stationList(keyID, keySecret);
	const DEVICE_QUANTITY = JSON_LIST.data.page.total;
	const RESULT_ARRAY = [];
	for (let index = 0; index < DEVICE_QUANTITY; index++) {
		const CANONICALIZED_RESOURCE = '/v1/api/collectorList';
		const CONTENT = `{"pageNo":1,"pageSize":20}`;
		const DETAILS = await getDetails(
			CANONICALIZED_RESOURCE,
			CONTENT,
			keyID,
			keySecret,
		);
		RESULT_ARRAY.push(JSON.parse(DETAILS));
	}
	return RESULT_ARRAY;
}

//COLLECTOR / DATALOGGER DETAIL (INDIVIDUAL)
async function collectorDetail(keyID, keySecret) {
	const JSON_LIST = await collectorList(keyID, keySecret);
	const DEVICE_QUANTITY = JSON_LIST[0].data.page.total;
	const RESULT_ARRAY = [];
  for (let index = 0; index < DEVICE_QUANTITY; index++) {
    const DEVICE_ID = Number(JSON_LIST[0].data.page.records[index].id);
		const DEVICE_SN = Number(JSON_LIST[0].data.page.records[index].sn);
		const CANONICALIZED_RESOURCE = '/v1/api/collectorDetail';
		const CONTENT = `{"id":${DEVICE_ID}, "sn":${DEVICE_SN}}`;
		const DETAILS = await getDetails(
			CANONICALIZED_RESOURCE,
			CONTENT,
			keyID,
			keySecret,
		);
		RESULT_ARRAY.push(JSON.parse(DETAILS));
	}
	return RESULT_ARRAY;
}

//INVERTER LIST (ALL)
async function inverterList(keyID, keySecret) {
	const JSON_LIST = await stationList(keyID, keySecret);
	const DEVICE_QUANTITY = JSON_LIST.data.page.total;
	const RESULT_ARRAY = [];
	for (let index = 0; index < DEVICE_QUANTITY; index++) {
		const DEVICE_ID = Number(JSON_LIST.data.page.records[index].id);
		const CANONICALIZED_RESOURCE = '/v1/api/inverterList';
		const CONTENT = `{"pageNo":1,"pageSize":20, "id":${DEVICE_ID}}`;
		const DETAILS = await getDetails(
			CANONICALIZED_RESOURCE,
			CONTENT,
			keyID,
			keySecret,
		);
		RESULT_ARRAY.push(JSON.parse(DETAILS));
	}
	return RESULT_ARRAY;
}

//INVERTER DETAIL (INDIVIDUAL)
async function inverterDetail(keyID, keySecret) {
	const JSON_LIST = await inverterList(keyID, keySecret);
	const DEVICE_QUANTITY = JSON_LIST[0].data.page.total;
	const RESULT_ARRAY = [];
	for (let index = 0; index < DEVICE_QUANTITY; index++) {
		const DEVICE_ID = JSON_LIST[0].data.page.records[index].id;
		const CANONICALIZED_RESOURCE = '/v1/api/inverterDetail';
		const CONTENT = `{"id":${DEVICE_ID}}`;
		const DETAILS = await getDetails(
			CANONICALIZED_RESOURCE,
			CONTENT,
			keyID,
			keySecret,
		);
		RESULT_ARRAY.push(JSON.parse(DETAILS));
	}
	return RESULT_ARRAY;
}

//PLANT DAILY GRAPH
async function daily5min(keyID, keySecret, startDate, endDate) {
	const JSON_LIST = await stationList(keyID, keySecret);
	const DEVICE_QUANTITY = JSON_LIST.data.stationStatusVo.all;
	const DAYS_QUANTITY = numOfDays(startDate, endDate);
	const INFO_ARRAY = [];
	const RESULT_ARRAY = [];
	for (let index = 0; index < DEVICE_QUANTITY; index++) {
		const DEVICE_ID = JSON_LIST.data.page.records[index].id;
		const DEVICE_MONEY = JSON_LIST.data.page.records[index].money;
		const DEVICE_TIMEZONE = JSON_LIST.data.page.records[index].timeZone;
		let dayToReturn = startDate;
		let nextDay = '';
		for (let index1 = 0; index1 < DAYS_QUANTITY; index1++) {
			const CANONICALIZED_RESOURCE = '/v1/api/stationDay';
			const CONTENT =
				`{"id":${DEVICE_ID}, "money":"${DEVICE_MONEY}", "time":"${dayToReturn}", "timeZone":${DEVICE_TIMEZONE}}`;
			const DETAILS = await getDetails(
				CANONICALIZED_RESOURCE,
				CONTENT,
				keyID,
				keySecret,
			);
			nextDay = addDay(dayToReturn, 1);
			dayToReturn = nextDay;
			INFO_ARRAY.push(JSON.parse(DETAILS));
		}
		RESULT_ARRAY.push(INFO_ARRAY);
	}
	return RESULT_ARRAY;
}
