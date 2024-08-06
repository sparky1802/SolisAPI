const CONSUME = await Deno.readTextFile('./cache/Consumed-5min.csv');
const GENERATE = await Deno.readTextFile('./cache/Generated-5min.csv');

function csvToJson() {
	const CON_ROWS = CONSUME.split('\n');
	const GEN_ROWS = GENERATE.split('\n');
	const DIFF = Number(CON_ROWS.length) - Number(GEN_ROWS.length);
	const CON_DATE_SYNC = CON_ROWS[DIFF + 1].split(',')[0];
	const GEN_DATE_SYNC = GEN_ROWS[1].split(',')[0];
	const CON_HEADER = CON_ROWS[0].split(',');
	const GEN_HEADER = GEN_ROWS[0].split(',');
	const JSON_DATA = [];
	const DATA = []
	let utcTime
	let utcEpocTime
	let localTime
	let key
	let conVal
	let genVal


	for (let iVal1 = 1; iVal1 < CON_ROWS.length - 1; iVal1++) {
		const CON_VAL = CON_ROWS[iVal1].split(',');
		for (let iVal2 = 0; iVal2 < CON_HEADER.length; iVal2++) {
			if (iVal2 === 0) {
				let getDate = CON_ROWS[iVal1].split(',')[0]
				let getYYYY = getDate.substring(getDate.indexOf('/',getDate.indexOf('/')+1)+1,getDate.length)
				let getMM = getDate.substring(getDate.indexOf('/')+1,getDate.indexOf('/',getDate.indexOf('/')+1))
				let getDD = getDate.substring(0,getDate.indexOf('/'))
				let getMyDate = new Date(`${getYYYY}-${getMM}-${getDD}`)
				utcTime = new Date(getMyDate.setHours(0,0,0,0))
				utcEpocTime = Number(utcTime)
				let YYYY = utcTime.getFullYear()
				let MM = (utcTime.getMonth()+1).toString().padStart(2,'0')
				let DD = utcTime.getDate().toString().padStart(2,'0')
				let hh = utcTime.getHours().toString().padStart(2,'0')
				let mm = utcTime.getMinutes().toString().padStart(2,'0')
				let ss = utcTime.getSeconds().toString().padStart(2,'0')
				let ms = utcTime.getMilliseconds().toString().padStart(3,'0')
				let tzh = Math.floor(utcTime.getTimezoneOffset() / 60)
				let tzm
					switch (true) {
					case tzh < 0:
						tzh = `+${(Math.ceil(utcTime.getTimezoneOffset() / 60)  * -1).toString().padStart(2,'0')}`
						tzm =((utcTime.getTimezoneOffset() / 60 - Math.ceil(utcTime.getTimezoneOffset() / 60)) * -60).toString().padStart(2,'0')
					break;
					case tzh > 0:
						tzh = `-${(Math.floor(utcTime.getTimezoneOffset() / 60)  * -1).toString().padStart(2,'0')}`
						tzm =((utcTime.getTimezoneOffset() / 60 - Math.floor(utcTime.getTimezoneOffset() / 60)) * -60).toString().padStart(2,'0')
					break;
					default:
						tzh = '+00'
						tzm = '00'
				}
				localTime = `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}.${ms}${tzh}:${tzm}`
			}
			
			//--
			if (iVal1 <= DIFF) {
				key = CON_HEADER[iVal2].trim();
				conVal = CON_VAL[iVal2].trim();
				if (conVal === '') {
					conVal = '0';
				}
				genVal = '0';
//				OBJECT[key] = [{ consume: conVal }, { feedIn: genVal }];
			} else {
				const GEN_VAL = GEN_ROWS[iVal1 - DIFF].split(',');
				key = CON_HEADER[iVal2].trim();
				conVal = CON_VAL[iVal2].trim();
				if (conVal === '') {
					conVal = '0';
				}
				genVal = GEN_VAL[iVal2].trim();
//				OBJECT[key] = [{ consume: conVal }, { feedIn: genVal }];
			}
//			console.log(key, conVal, genVal)
			const OBJECT = {
				utcDateTime:utcTime,
				utcTimeStamp:utcEpocTime,
				localDateTime:localTime,
				powerCunsume:conVal,
				powerProduce:genVal
			};
			DATA.push(OBJECT);

			//--

			//            const key = CON_HEADER[iVal2].trim();
			//            const VALUE = CON_VAL[iVal2].trim();
			//            OBJECT[key] = VALUE;
		}
//		DATA.push(OBJECT);
	}

	JSON_DATA.push({data:DATA});
	return JSON_DATA
}

const RESULT = await csvToJson();
//console.log(Object.keys(RESULT).length)
//console.log(RESULT[782])
Deno.writeTextFile('./cache/powerInfo.json', JSON.stringify(RESULT));
