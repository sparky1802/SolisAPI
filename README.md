# SolisAPI
## Requirements
| Credential     | Meaning  |
| -------------- | -------- |
| **keyID:**     | username |
| **keySecret:** | password |
## Output
All output is a JSON object

## Plant Interface
### List all the Power Stations under the account
 
```JavaScript
import {
	userStationList,
} from './solisAPI.js';
let keyID = 'Your keyID';
let keySecret = 'Your keySecret';

const USER_STATION_LIST = await userStationList(keyID, keySecret)
console.log(USER_STATION_LIST)
```