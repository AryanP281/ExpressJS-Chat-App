
/********************************Imports*********************/
import EXPRESS from "express"
import {JWT_SECRET_KEY} from "./Config/App";
import jwt from "jsonwebtoken";

/********************************Middleware*********************/
function verifyUserToken(req : EXPRESS.Request, resp : EXPRESS.Response, next : any) : void
{
    /*Middleware for verifing the user token*/

    const token : string  = req.cookies.token; //Getting the token from the header
    if(token === undefined)
        resp.status(403).json({auth:false,message:"No token provided"});
    else
    {
        //Verifing the token
        const jwtVerificiationPromise = new Promise<any>((resolve,reject) => {
            jwt.verify(token, JWT_SECRET_KEY, (err,decoded) => {
                if(err)
                    reject(err);
                else
                    resolve(decoded!);
            });
        })

        jwtVerificiationPromise.then((decoded) => {
        req.body["userId"] = decoded; //Adding the user id to the request
        next();
        })
        .catch((err) => resp.status(500).json({auth:false,message:err}));
    }
}

/********************************Exports*********************/
export {verifyUserToken};