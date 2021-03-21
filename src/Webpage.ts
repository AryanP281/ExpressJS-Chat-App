
/**************************Imports*********************/
import EXPRESS from "express";
import PATH from "path";

/**************************Initialization*********************/
const router : EXPRESS.Router = EXPRESS.Router(); //Creating router for express app

/**************************Routing*********************/
router.get("/", (req,resp) => {
    
    resp.render("ChatRoom");

});


/**************************Exports*********************/
export {router as expressRouter};
