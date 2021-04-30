
/*******************************Imports*************************/
import io from "socket.io"
import {addToRoom} from "./ChatroomController"
import jwt from "jsonwebtoken"
import { JWT_SECRET_KEY } from "../Config/App";

/*******************************Functions*************************/
function parseCookies(cookieStr : string)
{
    /*Creates an object containing the cookies in the given cookie string*/
    
    const parsedCookies : any = {}; //The parsed cookies as key value pair

    //Separating the cookies
    const separatedCookies : string[] = cookieStr.split(';');

    //Getting the cookie key and values
    separatedCookies.forEach((cookie) => {
        const keyValue = cookie.split('=');
        parsedCookies[keyValue[0].trim()] = keyValue[1];
    })

    return parsedCookies;
}


/*******************************Event Handlers*************************/
function connectClient(socket : io.Socket)
{
    /*Connects a new client socket to a room*/

    //Parsing the cookies in the header
    const parsedCookies : any = parseCookies(socket.handshake.headers.cookie!);
    
   //Verifing the room token
   const roomToken : string = parsedCookies.roomToken;
   const jwtVerificationPromise = new Promise<any>((resolve,reject) => {
       jwt.verify(roomToken, JWT_SECRET_KEY, (err, decoded) => {
           if(err)
                reject(err);
            else
                resolve(decoded!);
       })
   })

   let roomId : string;
   jwtVerificationPromise.then((roomIdDecoded : any) => {
        roomId = roomIdDecoded;

        //Verifing the user token
        const userToken : string = parsedCookies.token;
        return new Promise<any>((resolve, reject) => {
            jwt.verify(userToken, JWT_SECRET_KEY, (err,decoded) => {
                if(err)
                    reject(err);
                else
                    resolve(decoded!);
            })
        });
   })
   .then((userId : any) => {
        //Adding the socket to the room
        addToRoom(socket, roomId, userId, parsedCookies.roomPublicId);

        //Sending success message
        socket.emit("Room Connection", {success:true});
   })
   .catch((err) => socket.emit("Room Connection", {success:false,error:err}));

}

/*******************************Exports*************************/
export {connectClient};
