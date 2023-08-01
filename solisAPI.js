import {
  authMessage,
  digestMessage,
  keySign,
  messageToSign,
} from "../utilities/restAuth.js"
import { addDay, numOfDays, sleep } from "../utilities/dateTime.js"

export {
  collectorDetail,
  collectorList,
  daily5min,
  inverterDetail,
  inverterList,
  stationDetail,
  stationList,
}

const contentHash = "MD5"
const contentType = "application/json"
const gmtDate = new Date().toUTCString()
const hostID = "https://soliscloud.com:13333"
const httpVerb = "POST"
const signAlgorithm = "HMAC"
const signFormat = "raw"
const signHash = "SHA-1"

//CREATE THE API REQUEST TO POST AND FETCH THE DATA IN JSON.STRINGIFY FORMAT
async function getDetails(canonicalizedResources, content, keyID, keySecret) {
  //Create the API request to post
  const contentMD5 = await digestMessage(contentHash, content)
  const message = await messageToSign(
    httpVerb,
    contentMD5,
    contentType,
    gmtDate,
    canonicalizedResources,
  )
  const signKey = await keySign(keySecret, signFormat, signAlgorithm, signHash)
  const authKey = await authMessage(signAlgorithm, signKey, message)
  const authorization = `API ${keyID}:${authKey}`
  const requestOptions = {
    method: httpVerb,
    url: hostID + canonicalizedResources,
    headers: {
      "Content-MD5": contentMD5,
      "Content-Type": contentType,
      "Date": gmtDate,
      "Authorization": authorization,
    },
    body: content,
  }
  //Fetch the data
  const resultResponse = await fetch(
    hostID + canonicalizedResources + "?" + authorization,
    requestOptions,
  )
    .then((response) => {
      return response.json()
    })
    .then((response) => {
      return JSON.stringify(response)
    })
    .catch((error) => {
      return error
    })
  await sleep(1667)
  return resultResponse
}

//POWER STATION LIST (ALL)
async function stationList(keyID, keySecret) {
  const canonicalizedResources = "/v1/api/userStationList"
  const content = `{"pageNo":1,"pageSize":20}`
  const details = await getDetails(
    canonicalizedResources,
    content,
    keyID,
    keySecret,
  )
  return details
}

//POWER DETAIL (INDIVIDUAL)
async function stationDetail(keyID, keySecret) {
  const jsonList = JSON.parse(await stationList(keyID, keySecret))
  const deviceQuantity = jsonList.data.stationStatusVo.all
  const resultArray = []
  for (let index = 0; index < deviceQuantity; index++) {
    const deviceID = jsonList.data.page.records[index].id
    const canonicalizedResources = "/v1/api/stationDetail"
    const content = `{"id":${deviceID}}`
    const details = await getDetails(
      canonicalizedResources,
      content,
      keyID,
      keySecret,
    )
    resultArray.push(details)
  }
  return resultArray
}

//COLLECTOR / DATALOGGER LIST (ALL)
async function collectorList(keyID, keySecret) {
  const jsonList = JSON.parse(await stationList(keyID, keySecret))
  const deviceQuantity = jsonList.data.stationStatusVo.all
  const resultArray = []
  for (let index = 0; index < deviceQuantity; index++) {
    const canonicalizedResources = "/v1/api/collectorList"
    const details = await getDetails(
      canonicalizedResources,
      content,
      keyID,
      keySecret,
    )
    resultArray.push(details)
  }
  return resultArray
}

//COLLECTOR / DATALOGGER DETAIL (INDIVIDUAL)
async function collectorDetail(keyID, keySecret) {
  const jsonList = JSON.parse(await collectorList(keyID, keySecret))
  const deviceQuantity = jsonList.data.collectionStatusVo.all
  const resultArray = []
  for (let index = 0; index < deviceQuantity; index++) {
    const deviceID = jsonList.data.page.records[index].id
    const canonicalizedResources = "/v1/api/collectorDetail"
    const content = `{"pageNo":1,"pageSize":20, "id":${deviceID}}`
    const details = await getDetails(
      canonicalizedResources,
      content,
      keyID,
      keySecret,
    )
    resultArray.push(details)
  }
  return resultArray
}

//INVERTER LIST (ALL)
async function inverterList(keyID, keySecret) {
  const jsonList = JSON.parse(await stationList(keyID, keySecret))
  const deviceQuantity = jsonList.data.stationStatusVo.all
  const resultArray = []
  for (let index = 0; index < deviceQuantity; index++) {
    const deviceID = jsonList.data.page.records[index].id
    const canonicalizedResources = "/v1/api/inverterList"
    const content = `{"pageNo":1,"pageSize":20, "id":${deviceID}}`
    const details = await getDetails(
      canonicalizedResources,
      content,
      keyID,
      keySecret,
    )
    resultArray.push(details)
  }
  return resultArray
}

//INVERTER DETAIL (INDIVIDUAL)
async function inverterDetail(keyID, keySecret) {
  const jsonList = JSON.parse(await inverterList(keyID, keySecret))
  const deviceQuantity = jsonList.data.inverterStatusVo.all
  const resultArray = []
  for (let index = 0; index < deviceQuantity; index++) {
    const deviceID = jsonList.data.page.records[index].id
    const canonicalizedResources = "/v1/api/inverterDetail"
    const content = `{"id":${deviceID}}`
    const details = await getDetails(
      canonicalizedResources,
      content,
      keyID,
      keySecret,
    )
    resultArray.push(details)
  }
  return resultArray
}

//PLANT DAILY GRAPH
async function daily5min(keyID, keySecret, startDate, endDate) {
  const jsonList = JSON.parse(await stationList(keyID, keySecret))
  const deviceQuantity = jsonList.data.stationStatusVo.all
  const daysQuantity = numOfDays(startDate, endDate)
  const infoArray = []
  const resultArray = []
  for (let index = 0; index < deviceQuantity; index++) {
    const deviceID = jsonList.data.page.records[index].id
    const deviceMoney = jsonList.data.page.records[index].money
    const deviceTimeZone = jsonList.data.page.records[index].timeZone
    let dayToReturn = startDate
    let nextDay = ""
    for (let index1 = 0; index1 < daysQuantity; index1++) {
      const canonicalizedResources = "/v1/api/stationDay"
      const content =
        `{"id":${deviceID}, "money":"${deviceMoney}", "time":"${dayToReturn}", "timeZone":${deviceTimeZone}}`
      const details = await getDetails(
        canonicalizedResources,
        content,
        keyID,
        keySecret,
      )
      nextDay = addDay(dayToReturn, 1)
      dayToReturn = nextDay
      infoArray.push(details)
    }
    resultArray.push(infoArray)
  }
  return resultArray
}
