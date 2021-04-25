
/*******************************Imports*************************/
import io from "socket.io"
import {addToRoom} from "./ChatroomController"
import jwt from "jsonwebtoken"
import { JWT_SECRET_KEY } from "../Config/App";

/*******************************Event Handlers*************************/
function connectClient(socket : io.Socket)
{
    /*Connects a new client socket to a room*/

   //Verifing the room token
   const roomToken : string = socket.handshake.query.roomToken as string;
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
        const userToken : string = socket.handshake.query.userToken as string;
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
        addToRoom(socket, roomId, userId);

        //Sending success message
        socket.emit("Room Connection", {success:true});
   })
   .catch((err) => socket.emit("Room Connection", {success:false,error:err}));
    
}

/*******************************Exports*************************/
export {connectClient};
