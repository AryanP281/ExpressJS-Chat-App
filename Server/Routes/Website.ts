
/********************************Imports*********************/
import express from "express";
import {verifyUserToken} from "../Middleware"

/********************************Variables*********************/
const router = express.Router(); //Creating a router

/********************************Routes*********************/
router.get("/register", (req,resp) => {
    /*Displays the registration page*/

    //Checking if the user is already logged in
    if(req.cookies.token !== undefined)
    {
        resp.redirect("/home");
        return;
    }

    resp.render("Register");
});

router.get("/profile", (req, resp) => {
    /*Displays the user profile page*/

    if(req.cookies.token === undefined)
    {
        resp.redirect("/login"); //Redirecting to login page as user is not signed in
        return;
    }

    resp.render("Profile");
});

router.get("/login", (req,resp) => {
    /*Displays the login page*/

    //Checking if the user is already logged in
    if(req.cookies.token !== undefined)
    {
        resp.redirect("/home");
        return;
    }

    resp.render("Login");
});

router.get("/home", (req,resp) => {
    /*Displays the home page*/

    if(req.cookies.token === undefined)
    {
        resp.redirect("/login"); //Redirecting to login page as user is not signed in
        return;
    }

    resp.render("Home");
});

router.get("/chat", (req,resp) =>{
    /*Displays the chat window*/

    resp.render("ChatScreen");
});

/********************************Exports*********************/
export {router as WebsiteRouter};
