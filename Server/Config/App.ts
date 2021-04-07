
/*************************Imports*******************/
import fs from "fs";

/*************************Variables*******************/
let JWT_SECRET_KEY : string; 

/*************************Script*******************/

//Parsing the config data saved in the text file
const configData : string[] = fs.readFileSync("Config.txt", "utf8").split('\n');

//Setting the jwt secret key
JWT_SECRET_KEY = configData[0];

/*************************Exports*******************/
export {JWT_SECRET_KEY};