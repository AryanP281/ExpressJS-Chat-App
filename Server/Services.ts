
/*******************************Imports***************************/
import crypto from "crypto"

/*******************************Functions***************************/
function generateRandomString(bytes : number) : string
{
    /*Generates a random string of the given bytes*/

    const randomStr : string = crypto.randomBytes(bytes).toString("hex");

    return randomStr;
}

/*******************************Exports***************************/
export {generateRandomString};
