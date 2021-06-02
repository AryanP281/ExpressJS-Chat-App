
/********************************Imports*********************/
import mongoose from "mongoose"
import {getRandomId} from "./HelperFuncs"

/************************Schemas*********************/
const roomSchema : mongoose.Schema = new mongoose.Schema(
    {
    roomPublicId : String,
    roomMsgCount : {
        type : Number,
        default : 0
    }
    },
    {
        collection : "Rooms"
    }
); //The schema representing rooms

/***************************Exports***************************/
export default mongoose.model("Room", roomSchema);
