
/********************************Imports*********************/
import express from "express";
import {verifyUserToken} from "../Middleware"

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
});

router.get("/home", (req,resp) => {
    /*Displays the home page*/

    resp.render("Home");
});

/********************************Exports*********************/
export {router as WebsiteRouter};
