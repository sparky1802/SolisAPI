# SolisAPI

## Requirements

| Credential     | Meaning  |
| -------------- | -------- |
| **keyID:**     | username |
| **keySecret:** | password |

## Output

All output is a JSON object

## config.json

- Update keyId and keySecret.
- Update stationId, timeZone and Money. Run the app and select `station` then
  `1` (userStationList) to get details about all your stations.

### List all the Power Stations under the account

```JavaScript
import { userStationList } from './solisAPI.js';
let keyID = 'Your keyID';
let keySecret = 'Your keySecret';

const USER_STATION_LIST = await userStationList(keyID, keySecret);
console.log(USER_STATION_LIST);
```
