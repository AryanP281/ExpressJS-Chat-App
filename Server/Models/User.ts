
/********************************Imports*********************/
import mongoose from "mongoose"
import {getRandomId} from "./HelperFuncs"

/********************************Schemas*********************/
const userSchema : mongoose.Schema = new mongoose.Schema(
    {
        _id : {
            type : String,
            default : () => getRandomId(12),
        },
        username : String
    },
    {
        collection: "Users"
    }
); //The user schema representing user objects 

/********************************Exports*********************/
export default mongoose.model("User", userSchema);
