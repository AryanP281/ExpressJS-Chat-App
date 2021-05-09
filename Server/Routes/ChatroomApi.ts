
/*******************************Imports***************************/
import express from "express"
import {verifyUserToken} from "../Middleware"
import {createRoom, joinRoom} from "../Controllers/ChatroomController"

/*******************************Variables***************************/
const router : express.Router = express.Router();

/*******************************Routes***************************/
router.get("/createroom", verifyUserToken, createRoom);
router.post("/joinroom", verifyUserToken, joinRoom);
router.post("/leaveRoom", verifyUserToken, )

/*******************************Exports***************************/
export {router as ChatroomApiRouter};
