
/*******************************Imports***************************/
import express from "express"
import {verifyUserToken} from "../Middleware"
import {createRoom, joinRoom, leaveRoom} from "../Controllers/ChatroomController"

/*******************************Variables***************************/
const router : express.Router = express.Router();

/*******************************Routes***************************/
router.get("/createroom", verifyUserToken, createRoom);
router.post("/joinroom", verifyUserToken, joinRoom);
router.get("/leaveroom", verifyUserToken, leaveRoom)

/*******************************Exports***************************/
export {router as ChatroomApiRouter};
