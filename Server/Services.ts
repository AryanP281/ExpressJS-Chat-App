
/*******************************Imports***************************/
import crypto from "crypto"

/*******************************Functions***************************/
function generateRandomString(bytes : number) : string
{
    /*Generates a random string of the given bytes*/

    const randomStr : string = crypto.randomBytes(bytes).toString("hex");

    return randomStr;
}

function parseCookies(cookieStr : string)
{
    /*Creates an object containing the cookies in the given cookie string*/
    
    const parsedCookies : any = {}; //The parsed cookies as key value pair

    //Separating the cookies
    const separatedCookies : string[] = cookieStr.split(';');

    //Getting the cookie key and values
    separatedCookies.forEach((cookie) => {
        const keyValue = cookie.split('=');
        parsedCookies[keyValue[0].trim()] = keyValue[1];
    })

    return parsedCookies;
}

/*******************************Exports***************************/
export {generateRandomString, parseCookies};
