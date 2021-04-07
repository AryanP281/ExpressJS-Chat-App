
/********************************Imports*********************/
import express from "express";

/********************************Variables*********************/
const router = express.Router(); //Creating a router

/********************************Routes*********************/
router.get("/register", (req,resp) => {
    /*Displays the registration page*/

    resp.render("Register");
});

router.get("/profile", (req, resp) => {
    /*Displays the user profile page*/

    resp.render("Profile");
});

router.get("/login", (req,resp) => {
    /*Displays the login page*/

    resp.render("Login");
})

/********************************Exports*********************/
export {router as WebsiteRouter};
