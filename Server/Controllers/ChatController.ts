
/*******************************Imports*************************/
import io from "socket.io"
import {addToRoom} from "./ChatroomController"
import jwt from "jsonwebtoken"
import { JWT_SECRET_KEY } from "../Config/App";
import {parseCookies} from "../Services";

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
        const result : {success : boolean, error : string} = addToRoom(socket, userId, roomId);

        //Sending result message
        socket.emit("Room Connection", result);
   })
   .catch((err) => {
        console.log(err)
        socket.emit("Room Connection", {success:false,error:err})
   });

}

/*******************************Exports*************************/
export {connectClient};
