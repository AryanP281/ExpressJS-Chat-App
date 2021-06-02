
/********************************Imports*********************/
import mongoose from "mongoose"
import {getRandomId} from "./HelperFuncs"

/********************************Schemas*********************/
const userCredsSchema : mongoose.Schema = new mongoose.Schema(
    {
        _id:{
            type:String,
            default: () => getRandomId(12)
        },
        email:String,
        password:String,
        userFK:String
    },
    {
        collection:"UserCreds"
    }
); //The schema for representing user credentials entry

/********************************Exports*********************/
export default mongoose.model("UserCred", userCredsSchema);
