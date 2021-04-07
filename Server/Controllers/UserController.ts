
/********************************Imports*********************/
import mongoose from "mongoose"
import EXPRESS from "express";
import UserModel from "../Models/User"
import UserCredsModel from "../Models/UserCreds"
import bcrypt from "bcrypt"
import {JWT_SECRET_KEY} from "../Config/App"
import jwt from "jsonwebtoken";

/********************************Variables*********************/
const PASSWORD_MIN_SIZE : number = 6; //The min permitted password length
const HASH_SALT : number = 10; //The salt to be used for hashing passwords

/********************************Helper Functions*********************/
function validateUserCreds(email:string,pss:string) : string | undefined
{
    /*Checks if the provided credentials are valid and returns the error message (if any)*/

    //Email check regex = ^(.)+(@)(\\D)+(\.)(\\D)+$
    const emailCheckRegex : RegExp = new RegExp("(.)+(@)(\\D)+(\.)(\\D)+"); //Creating the regex to be used for checking email formats

    //Checking email format
    if(!emailCheckRegex.test(email))
        return "Invalid email format";
    else if(pss.length < PASSWORD_MIN_SIZE)
        return `Password should be atleast ${PASSWORD_MIN_SIZE} characters long`;
    
    return undefined;
}


/********************************Controller Functions*********************/
function addUserCreds(req : EXPRESS.Request, resp : EXPRESS.Response) : void
{
    /*Saves the entered user creds*/

    //Getting credentials
    const email : string = req.body.email.trim();
    const pss : string = req.body.password.trim();

    //Validating the input
    const error : string | undefined = validateUserCreds(email,pss);
    if(typeof error == "undefined")
    {
        //Input is of correct format

        //Checking if email is already registered
        const emailCheckPromise = UserCredsModel.findOne({email:email});
        emailCheckPromise.then((doc : mongoose.Document<any,{}>|null) => {
            if(doc === null)
            {
                //Getting the hashed password
                const hashedPassword : string = bcrypt.hashSync(pss,HASH_SALT);

                //Adding the creds to database
                const userCredsPromise = UserCredsModel.create({email,password:hashedPassword});
                let credsId : string; //The id of the document storing the creds
                let userObjId : string; //The id of the document storing the user info
                userCredsPromise.then((creds) => {
                    credsId = creds._id;
                    //Creating the user model
                    return UserModel.create({username:""})
                })
                .then((userObj) => {
                    userObjId = userObj._id;
                    //Adding the foreign key to the creds document
                    return UserCredsModel.updateOne({_id:credsId}, {$set:{userFK:userObj._id}});
                })
                .then(() => {
                    resp.status(200).json({token:jwt.sign({id:userObjId}, JWT_SECRET_KEY)})
                })
                .catch((error) => resp.status(500).json({success:false,error}));
            }
            else
                resp.status(200).json({error:"Email already registered"}); //Sending error response
        })

        
    }   
    else
        resp.status(200).json({error}); //Sending error response


}

function updateUserDetails(req : EXPRESS.Request, resp : EXPRESS.Response) : void
{
    /*Updates the details of the given user*/

    const userId : string = req.body["userId"];

    //Creating promise to update the user details
    const updateUserDetailsPromise = UserModel.updateOne({_id:userId}, {$set:{username:req.body["username"]}});
    updateUserDetailsPromise.then((res) => resp.status(200).json({success:true}))
        .catch((err) => resp.status(500).json({success:false,error:err}));
}

function getUserDetails(req : EXPRESS.Request, resp : EXPRESS.Response)
{
    /*Retrives the details of the given user*/

    const userId : string = req.body["userId"];

    //Creating promise to retrieve user details
    const getUserDetailsPromise = UserModel.findOne({_id:userId});
    getUserDetailsPromise.then((user) => resp.status(200).json({success:true,user:{username:user?.get("username")}}))
        .catch((err) => resp.status(500).json({success:false,error:err}));

}

function checkCreds(req : EXPRESS.Request, resp : EXPRESS.Response)
{
    /*Checks if the creds provided by the user are correct and returns access token*/

    const email : string = req.body.email;
    const password : string = req.body.password;

    //Checking if email exists
    const emailCheckPromise = UserCredsModel.findOne({email:email});
    emailCheckPromise.then((res) => {
        //Checking if email exists
        if(res === null)
            resp.status(200).json({success:false,error:"User not found"});
        else
        {
            //Checking if the passwords match
            if(bcrypt.compareSync(password, res.get("password")))
                resp.status(200).json({success:true,token:jwt.sign({id:res._id}, JWT_SECRET_KEY)});
            else
                resp.status(200).json({success:false,error:"Incorrect password"});
        }
    })
    .catch((err) => resp.status(500).json({success:false,error:err}));

}

/********************************Exports*********************/
export {updateUserDetails, addUserCreds, getUserDetails, checkCreds};