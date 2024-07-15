import {
	authMessage,
	digestMessage,
	keySign,
	messageToSign,
} from './restAuth.js';
import { checkFileStatus } from './utilities.js';
import { addDay, numOfDays, sleep } from './dateTime.js';

export {
	getData,
	userStationList,
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
async function getDetails(CANONICALIZED_RESOURCE, CONTENT, KEY_ID, KEY_SECRET) {
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
	try {
		const response = await fetch(HOST_ID + CANONICALIZED_RESOURCE+ '?' + AUTHORIZATION, REQUEST_OPTIONS);
		const data = await response.json();
		await sleep(1667); // If needed
		return JSON.stringify(data);
	  } catch (error) {
		return error.toString();
	  }
/**	
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
**/
	}

//USER STATION LIST (ALL)
async function userStationList(KEY_ID, KEY_SECRET) {
	const FILE_STATUS = await checkFileStatus('./cache/userStationList.json')
	if ((FILE_STATUS.exist === true || FILE_STATUS.exist === false) && FILE_STATUS.stale === true) {
		const CANONICALIZED_RESOURCE = '/v1/api/userStationList';
		const CONTENT = `{"pageNo":"1","pageSize":"20"}`;
		const DETAILS = await getDetails(
			CANONICALIZED_RESOURCE,
			CONTENT,
			KEY_ID,
			KEY_SECRET,
		);
		Deno.writeTextFile("./cache/userStationList.json", DETAILS)
		return JSON.parse(DETAILS);	
	} else {
		const DETAILS = await Deno.readTextFile("./cache/userStationList.json")
		return JSON.parse(DETAILS);
	}
}

//GET THE DATA 
async function getData(KEY_ID, KEY_SECRET, CANONICALIZED_RESOURCE, START_DATE, END_DATE) {
	const JSON_INFO = await userStationList(KEY_ID, KEY_SECRET);
	const UNIT_QUANTITY = JSON_INFO.data.page.total;
	const CURRENCY = JSON_INFO.data.page.records[0].money;
	const TIMEZONE = JSON_INFO.data.page.records[0].timeZone;
	const DAYS_QUANTITY = numOfDays(START_DATE, END_DATE);
	const RESULT_ARRAY = [];
	let content;
	let unitQuantity;
	let jsonList;
  
	for (let iDev = 0; iDev < UNIT_QUANTITY; iDev++) {
	  const UNIT_ID = JSON_INFO.data.page.records[iDev].id;
  
	  switch (CANONICALIZED_RESOURCE) {
		case '/v1/api/alarmList':
		case '/v1/api/collectorList':
		case '/v1/api/inverterDetailList':
		case '/v1/api/inverterList':
		case '/v1/api/stationDetailList':
		  content = `{"pageNo":"1","pageSize":"20"}`;
		  unitQuantity = UNIT_QUANTITY;
		  break;
		case '/v1/api/collectorDetail':
		case '/v1/api/collector/day':
		  jsonList = await getData(KEY_ID, KEY_SECRET, '/v1/api/collectorList');
		  unitQuantity = jsonList[0].data.page.total;
		  break;
		case '/v1/api/inverterAll':
		case '/v1/api/inverterDay':
		case '/v1/api/inverterDetail':
		case '/v1/api/inverterMonth':
		case '/v1/api/inverterYear':
		case '/v1/api/inverter/shelfTime':
		  jsonList = await getData(KEY_ID, KEY_SECRET, '/v1/api/inverterList');
		  unitQuantity = jsonList[0].data.page.total;
		  break;
		case '/v1/api/stationDetail':
		  content = `{"id":"${UNIT_ID}"}`;
		  unitQuantity = UNIT_QUANTITY;
		  break;
		case '/v1/api/stationDayEnergyList':
		case '/v1/api/stationMonthEnergyList':
		case '/v1/api/stationYearEnergyList':
		  content = `{"pageNo":"1", "pageSize":"20", "time":"${START_DATE}", "stationId":"${UNIT_ID}"}`;
		  unitQuantity = UNIT_QUANTITY;
		  break;
		case '/v1/api/stationDay':
		  content = `{"id":"${UNIT_ID}", "money":"${CURRENCY}", "time":"${START_DATE}", "timeZone":"${TIMEZONE}"}`;
		  unitQuantity = UNIT_QUANTITY;
		  break;
		case '/v1/api/stationMonth':
		  content = `{"id":"${UNIT_ID}", "money":"${CURRENCY}", "month":"${START_DATE.substr(0, START_DATE.length - 3)}", "timeZone":"${TIMEZONE}"}`;
		  unitQuantity = UNIT_QUANTITY;
		  break;
		case '/v1/api/stationYear':
		  content = `{"id":"${UNIT_ID}", "money":"${CURRENCY}", "year":"${START_DATE.substr(0, START_DATE.length - 6)}", "timeZone":"${TIMEZONE}"}`;
		  unitQuantity = UNIT_QUANTITY;
		  break;
		case '/v1/api/stationAll':
		  content = `{"id":"${UNIT_ID}", "money":"${CURRENCY}", "timeZone":"${TIMEZONE}"}`;
		  unitQuantity = UNIT_QUANTITY;
		  break;
		default:
		  throw new Error(`Unknown CANONICALIZED_RESOURCE: ${CANONICALIZED_RESOURCE}`);
	  }
  
	  const detailPromises = [];
	  for (let iUni = 0; iUni < unitQuantity; iUni++) {
		let unitId, unitSn, unitTz;
		if (unitQuantity > 1) {
		  unitId = jsonList[0].data.page.records[iUni].id;
		  unitSn = jsonList[0].data.page.records[iUni].sn;
		  unitTz = jsonList[0].data.page.records[iUni].timeZone;
		  switch (CANONICALIZED_RESOURCE) {
			case '/v1/api/inverterDetail':
			  content = `{"id":"${unitId}", "sn":"${unitSn}"}`;
			  break;
			case '/v1/api/inverterDay':
			  content = `{"id":"${unitId}", "sn":"${unitSn}", "money":"${CURRENCY}", "time":"${START_DATE}", "timeZone":"${unitTz}"}`;
			  break;
			case '/v1/api/inverterMonth':
			  content = `{"id":"${unitId}", "sn":"${unitSn}", "money":"${CURRENCY}", "month":"${START_DATE.substr(0, START_DATE.length - 3)}", "timeZone":"${unitTz}"}`;
			  break;
			case '/v1/api/inverterYear':
			  content = `{"id":"${unitId}", "sn":"${unitSn}", "money":"${CURRENCY}", "year":"${START_DATE.substr(0, START_DATE.length - 6)}", "timeZone":"${unitTz}"}`;
			  break;
			case '/v1/api/inverterAll':
			  content = `{"id":"${unitId}", "sn":"${unitSn}", "money":"${CURRENCY}"}`;
			  break;
			case '/v1/api/inverter/shelfTime':
			  content = `{"pageNo":"1", "pageSize":"20", "sn":"${unitSn}"}`;
			  break;
			case '/v1/api/collectorDetail':
			  content = `{"id":"${unitId}", "sn":"${unitSn}"}`;
			  break;
			case '/v1/api/collector/day':
			  content = `{"sn":"${unitSn}", "time":"${START_DATE}", "timeZone":"${unitTz}"}`;
			  break;
			default:
			  throw new Error(`Unknown CANONICALIZED_RESOURCE: ${CANONICALIZED_RESOURCE}`);
		  }
		}
  
		detailPromises.push(
		  getDetails(CANONICALIZED_RESOURCE, content, KEY_ID, KEY_SECRET)
			.then((DETAILS) => JSON.parse(DETAILS))
		);
	  }
	  const detailsResults = await Promise.all(detailPromises);
	  RESULT_ARRAY.push(...detailsResults);
	}
  
	return RESULT_ARRAY;
  }


/**
//PLANT DAILY GRAPH
async function daily5min(KEY_ID, KEY_SECRET, startDate, endDate) {
	const JSON_LIST = await userStationList(KEY_ID, KEY_SECRET);
	const STATION_QUANTITY = JSON_LIST.data.stationStatusVo.all;
	const DAYS_QUANTITY = numOfDays(startDate, endDate);
	const INFO_ARRAY = [];
	const RESULT_ARRAY = [];
	for (let index = 0; index < STATION_QUANTITY; index++) {
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
				KEY_ID,
				KEY_SECRET,
			);
			nextDay = addDay(dayToReturn, 1);
			dayToReturn = nextDay;
			INFO_ARRAY.push(JSON.parse(DETAILS));
		}
		RESULT_ARRAY.push(INFO_ARRAY);
	}
	return RESULT_ARRAY;
}

**/