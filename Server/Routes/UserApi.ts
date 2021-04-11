
/********************************Imports*********************/
import EXPRESS from "express";
import {verifyUserToken} from "../Middleware"
import {updateUserDetails, addUserCreds, getUserDetails, checkCreds} from "../Controllers/UserController";

/********************************Variables*********************/
const router : EXPRESS.Router = EXPRESS.Router(); //Creating a router


/********************************Routes*********************/
router.post("/updateuser", verifyUserToken,updateUserDetails);
router.post("/addusercreds", addUserCreds)
router.get("/getuser",verifyUserToken,getUserDetails);
router.post("/login", checkCreds);

/********************************Exports*********************/
export {router as UserApiRouter};
