
/********************************Imports*********************/
import crypto from "crypto"

/********************************Functions*********************/
function getRandomId(idLen : number) : String
{
    return crypto.randomBytes(idLen).toString("hex");
}

/********************************Exports*********************/
export {getRandomId};
