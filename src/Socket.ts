
/**************************Imports*********************/
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import SOCK from "socket.io";
import { isObjectBindingPattern } from "typescript";

/**************************Variables*********************/
const roomMap : Map<string,SOCK.Socket[]> = new Map<string,SOCK.Socket[]>(); //Map for holding the socket connections for each room
let ioServer : SOCK.Server<DefaultEventsMap,DefaultEventsMap>; //The socket.io server object

/**************************Socket Events*********************/
function socketOnConnection(socket : SOCK.Socket)
{
    /*Handles client on connected event */
    
    //Handling the messages received from the socket
    socket.on("message", (msg) => {
        ioServer.emit("message",msg);
    }); 
}

/**************************Functions*********************/
function setIoEvents(io : SOCK.Server<DefaultEventsMap,DefaultEventsMap>) : void
{
    /*Routes the socket events */

    ioServer = io;

    //Routing the connection event
    io.on("connection", (socket : SOCK.Socket) => socketOnConnection(socket));

}

function messageReceived(msg : string, socket : SOCK.Socket)
{
    /*Handles message received event for the given socket*/

    console.log(ioServer)
    ioServer.emit("message", msg);
}

/**************************Exports*********************/
export {setIoEvents};
