
/*******************************Imports***************************/
import {Socket} from "socket.io"
import {parseCookies} from "../Services";
import jwt from "jsonwebtoken";
import {removeRoom} from "../Controllers/ChatroomController";
import {mongodbClient} from "../Config/Mongo";
import {Collection} from "mongodb";
import roomModel from "./RoomDbModel";
import ChatMessage from "./ChatMessage";

/*******************************Class***************************/

class Room
{
    /*****************************Fields*******************************/
    static roomReconnectionTimeout : number = 5000; //After the last user has left the room, time in ms to wait for new connections before deleting the room
    static pageSize : number = 100;

    private roomId : string; //The id of the room
    private roomPublicId : string; //The public id of the room
    private userSockets : Map<string,Socket>; //The socket for each user

    private roomMsgCount : number; //The number of messages in the rooms db
    private msgBuffer : ChatMessage[] = []; //Buffer of the messages yet to be written to db
    private writingToDbSemaphore : boolean = false; //A semaphore to check if the messages are currently being written to the database
    
    /***************************Constructors************************** */
    constructor(id : string, publicId : string, msgCount : number = 0)
    {
        this.roomId = id;
        this.roomPublicId = publicId;
        this.roomMsgCount = msgCount;

        this.userSockets = new Map<string,Socket>();
    }

    /****************************Methods******************************* */
    public removeUser(userId : string) : void
    {
        /*Removes the socket used for connecting with the user*/

        this.userSockets.delete(userId);
    }

    public addUserSocket(socket : Socket, userId : string) : Promise<any>
    {
        /*Adds a new user socket to the room*/

        //Setting the socket events
        const roomObjRef = this;
        socket.on("sendMessage", (data) => roomObjRef.broadcastMessage(data, roomObjRef, userId));
        socket.on("disconnect", () => roomObjRef.socketDisconnected(socket, roomObjRef));

        this.userSockets.set(userId, socket);

        //Creating the message history promise
        const prom = new Promise<any>((resolve,reject) => {
            const currPageMessages : any[] = [];
            mongodbClient.db().collection(roomObjRef.roomId, (err, collection) => {
                if(err)
                    reject(err);
                else
                {
                    const max  = function(x : number, y : number)
                    {
                        return (x > y) ? x : y;
                    }

                    const endIndex : number = (roomObjRef.msgBuffer.length) ? (roomObjRef.msgBuffer[roomObjRef.msgBuffer.length-1].index - 
                        roomObjRef.msgBuffer.length) : roomObjRef.roomMsgCount - 1;
                    const startIndex : number = max(0, endIndex - 200);
                    collection.find({index : {$gt : startIndex-1, $lt: endIndex+1}}).toArray((err, result) => {
                        if(err)
                            reject(err);
                        else
                        {
                            roomObjRef.msgBuffer.forEach((msg) => result.push(msg));
                            resolve({success:true,msgs:result});
                        }
                    });
                }
            });
        });

        return prom;
    }

    /*******************************Functions***************************** */
    private broadcastMessage(msg : {message : string, username : string}, roomObjRef : Room, senderId : string)
    {
        /*Broadcasts the message to every other socket in the room*/

        //Broadcasting the message to all the sockets in the room
        roomObjRef.userSockets.forEach((socket : Socket, userId : string) => {
            socket.emit("getMessage", msg);
        });

        //Pushing the message to buffer
        roomObjRef.msgBuffer.push(new ChatMessage(roomObjRef.roomMsgCount + roomObjRef.msgBuffer.length, senderId, msg.message, Date()));

        //Checking if the message buffer is full
        if(roomObjRef.msgBuffer.length >= 10 && !roomObjRef.writingToDbSemaphore)
            roomObjRef.writeMessagesToDb(roomObjRef);

    }

    private writeMessagesToDb(roomObjRef : Room) : void
    {
        /*Writes the messages in the buffer to the database*/

        //Setting the semaphore
        roomObjRef.writingToDbSemaphore = true;

        let bufferLen : number; //The number of messages in the buffer at the time of writing to db

        //Checking if this is the 1st batch of messages and a new collection needs to be created
        let collectionPromise : Promise<Collection<any>>;
        if(roomObjRef.roomMsgCount === 0)
        {
            //Creating the collection
            collectionPromise = new Promise<any>((resolve,reject) => {
                mongodbClient.db().createCollection(roomObjRef.roomId, (err, coll) => {
                    if(err)
                        reject(err);
                    else
                        resolve(coll);
                });
            });
        }
        else
        {
            //Getting the required collection
            collectionPromise = new Promise<any>((resolve,reject) => {
                mongodbClient.db().collection(roomObjRef.roomId, (err, coll) => {
                    if(err)
                        reject(err);
                    else
                        resolve(coll);
                });
            })
        }
        
        //Writing the messages to the collection
        collectionPromise.then((collection) => {
            collection.insertMany(roomObjRef.msgBuffer)
            
            //Saving the number of messages in the buffer. 
            //This will help to prevent losing of newly added messages when the buffer is popped after writing
            bufferLen = roomObjRef.msgBuffer.length;
        })
        .then(() => {
            //Incrementing the number of messages
            roomObjRef.roomMsgCount += bufferLen;

            //Clearing the buffer
            roomObjRef.msgBuffer.splice(0,bufferLen);

            //Unlocking the semaphore
            roomObjRef.writingToDbSemaphore = false;

            //Creating promise to update message count in room document
            return roomModel.updateOne({_id : roomObjRef.roomId}, {$set:{roomMsgCount:roomObjRef.roomMsgCount}});
        })
        .catch((err) => console.log(err));
      
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

    /***********************************Getters**************************/
    public get RoomId() : string
    {
        return this.roomId;
    }

    public get PublicId() : string
    {
        return this.roomPublicId;
    }

};

/*******************************Exports***************************/
export {Room};

/*

*/