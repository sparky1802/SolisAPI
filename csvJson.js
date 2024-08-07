const CONSUME = await Deno.readTextFile('./cache/Consumed-5min.csv');
const GENERATE = await Deno.readTextFile('./cache/Generated-5min.csv');

function csvToJson() {
	const CON_ROWS = CONSUME.split('\n');
	const GEN_ROWS = GENERATE.split('\n');
	const DIFF = Number(CON_ROWS.length) - Number(GEN_ROWS.length);
	const CON_HEADER = CON_ROWS[0].split(',');
	const JSON_DATA = [];
	const DATA = []

	for (let iVal1 = 1; iVal1 < CON_ROWS.length - 1; iVal1++) {
		const CON_VAL = CON_ROWS[iVal1].split(',');
		let utcDetails
		let addTime
		for (let iVal2 = 0; iVal2 < CON_HEADER.length; iVal2++) {
			let conVal
			let genVal
			if (iVal2 === 0) {
				addTime = 0
				utcDetails = timeDetails(CON_ROWS[iVal1].split(',')[0])
			}else{
				if (iVal1 <= DIFF) {
					conVal = CON_VAL[iVal2].trim();
					genVal = '0'
					if (conVal === '') {
						conVal = '0';
					}
				} else {
					const GEN_VAL = GEN_ROWS[iVal1 - DIFF].split(',');
					conVal = CON_VAL[iVal2].trim();
					if (conVal === '') {
						conVal = '0';
					}
					genVal = GEN_VAL[iVal2].trim();
				}
				const NEW_DATE = new Date (utcDetails)
				const NEW_TIME = new Date (NEW_DATE.getTime() + addTime++ * 5 * 60 *1000)
				
				const OBJECT = {
					utcDateTime:NEW_TIME,
					utcTimeStamp:Number(NEW_TIME),
					localDateTime:NEW_TIME.toLocaleString(),
					powerCunsume:conVal,
					powerProduce:genVal
				};
				DATA.push(OBJECT);
			}
		}
	}
	JSON_DATA.push({data:DATA});
	return JSON_DATA
}

function timeDetails(DATE) {
	const GET_DATE = DATE
	const GET_YYYY = GET_DATE.substring(GET_DATE.indexOf('/',GET_DATE.indexOf('/')+1)+1,GET_DATE.length)
	const GET_MM = GET_DATE.substring(GET_DATE.indexOf('/')+1,GET_DATE.indexOf('/',GET_DATE.indexOf('/')+1))
	const GET_DD = GET_DATE.substring(0,GET_DATE.indexOf('/'))
	const GET_MY_DATE = new Date(`${GET_YYYY}-${GET_MM}-${GET_DD}`)
	const UTC_TIME = new Date(GET_MY_DATE.setHours(0,0,0,0))
	return UTC_TIME.toISOString()
}

const RESULT = await csvToJson();
Deno.writeTextFile('./cache/powerInfo.json', JSON.stringify(RESULT));
