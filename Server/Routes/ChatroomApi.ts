
/*******************************Imports***************************/
import express from "express"
import {verifyUserToken} from "../Middleware"
import {createRoom, joinRoom} from "../Controllers/ChatroomController"

/*******************************Variables***************************/
const router : express.Router = express.Router();

/*******************************Routes***************************/
router.get("/createroom", verifyUserToken, createRoom);
router.post("/joinRoom", verifyUserToken, joinRoom);

/*******************************Exports***************************/
export {router as ChatroomApiRouter};
