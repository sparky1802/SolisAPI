import { exists } from "@std/fs/exists";

export { checkFileStatus };

async function checkFileStatus(){
    const FILE = "./cache/userStationList.json"
    const FILE_EXISTS = await exists(FILE)
    if (FILE_EXISTS === true) {
        const FILE_TO_CHECK = await Deno.stat("./cache/userStationList.json")
        const NOW = new Date()
        const LAST_MODIFIED  = FILE_TO_CHECK.mtime;
        const IS_STALE = NOW.getTime() - LAST_MODIFIED > NOW.getTime() - (NOW.getTime()-(15*60*1000))
        if (IS_STALE === true) {
            const TEXT = `{"exist": ${FILE_EXISTS}, "stale": ${IS_STALE}}\r\n`;
            return JSON.parse(TEXT);
        } else {
            const TEXT = `{"exist": ${FILE_EXISTS}, "stale": ${IS_STALE}}\r\n`;
            return JSON.parse(TEXT);
        }
    } else {
        const IS_STALE = true
        const TEXT = `{"exist": ${FILE_EXISTS}, "stale": ${IS_STALE}}\r\n`;
        return JSON.parse(TEXT);
    }
}