
/*******************************Imports***************************/
import {Socket} from "socket.io"
import {parseCookies} from "../Services";
import jwt from "jsonwebtoken";
import {removeRoom} from "../Controllers/ChatroomController";

/*******************************Class***************************/

class Room
{
    /*****************************Fields*******************************/
    static roomReconnectionTimeout : number = 5000; //After the last user has left the room, time in ms to wait for new connections before deleting the room
    private roomCreator : string; //The id of the user that created the room
    public roomId : string; //The id of the room
    public roomPublicId : string; //The public id of the room
    private userSockets : Map<string,Socket>; //The socket for each user
    
    /***************************Constructors************************** */
    constructor(id : string, publicId : string, creatorId : string)
    {
        this.roomId = id;
        this.roomPublicId = publicId;
        this.roomCreator = creatorId;

        this.userSockets = new Map<string,Socket>();
    }

    /****************************Methods******************************* */
    public removeUser(userId : string) : void
    {
        /*Removes the socket used for connecting with the user*/

        this.userSockets.delete(userId);
    }

    public addUserSocket(socket : Socket, userId : string) : void
    {
        /*Adds a new user socket to the room*/

        //Setting the socket events
        const roomObjRef = this;
        socket.on("sendMessage", (data) => roomObjRef.broadcastMessage(data, roomObjRef));
        socket.on("disconnect", () => roomObjRef.socketDisconnected(socket, roomObjRef));

        this.userSockets.set(userId, socket);
    }

    /*******************************Functions***************************** */
    private broadcastMessage(msg : {message : string, username : string}, roomObjRef : Room)
    {
        /*Broadcasts the message to every other socket in the room*/

        //Broadcasting the message to all the sockets in the room
        roomObjRef.userSockets.forEach((socket : Socket, userId : string) => {
            socket.emit("getMessage", msg);
        });
    }

    private socketDisconnected(socket : Socket, roomObjRef : Room)
    {
        /*Handles socket disconnction event*/

        //Parsing the socket cookies
        const parsedCookies = parseCookies(socket.handshake.headers.cookie!);

        //Getting the user id
        const userToken : string = parsedCookies.token;
        const userId : string = jwt.decode(userToken) as string;
        
        //Removing the user socket
        roomObjRef.userSockets.delete(userId);

        //Checking if the room is empty
        if(roomObjRef.userSockets.size === 0)
        {
            //Starting the room removal timer
            const removeDeletePromise : Promise<void> = new Promise<void>((resolve) => {
                setTimeout(resolve, Room.roomReconnectionTimeout);
            });

            removeDeletePromise.then(() => {
                //Checking if any user has joined the room
                if(roomObjRef.userSockets.size === 0)
                {
                    //Removing the room
                    removeRoom(roomObjRef);
                    return;
                }
            })
        }

    }

};

/*******************************Exports***************************/
export {Room};
