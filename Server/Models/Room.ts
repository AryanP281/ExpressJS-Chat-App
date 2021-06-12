
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
    static pageSize : number = 10; 
    static messageWriteTimeout : number = 10000;

    private roomId : string; //The id of the room
    private roomPublicId : string; //The public id of the room
    private userSockets : Map<string,Socket>; //The socket for each user

    private roomMsgCount : number; //The number of messages in the rooms db
    private msgBuffer : ChatMessage[] = []; //Buffer of the messages yet to be written to db
    private writingToDbSemaphore : boolean = false; //A semaphore to check if the messages are currently being written to the database

    private dbCollection : Collection | undefined = undefined; //The mongodb collection containing the room chat messages
    
    /***************************Constructors************************** */
    constructor(id : string, publicId : string, msgCount : number = 0)
    {
        this.roomId = id;
        this.roomPublicId = publicId;
        this.roomMsgCount = msgCount;

        this.userSockets = new Map<string,Socket>();
        
        //Starting the infinite timed loop to save messages to database
        this.saveMessages();

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
        socket.on("getPrevPage", (data) => roomObjRef.getPrevPage(data, socket, roomObjRef));
        socket.on("getNextPage", (data) => roomObjRef.getNextPage(data, socket, roomObjRef));

        this.userSockets.set(userId, socket);

        //Creating the message history promise
        const prom = new Promise<any>((resolve,reject) => {
            
            const sendInitialPage = function(collection : Collection)
            {
                const endIndex : number = (roomObjRef.msgBuffer.length) ? (roomObjRef.msgBuffer[roomObjRef.msgBuffer.length-1].index - 
                    roomObjRef.msgBuffer.length) : roomObjRef.roomMsgCount+1;
                const startIndex : number = roomObjRef.max(0, endIndex - Room.pageSize);
                collection.find({index : {$gt : startIndex-1, $lt: endIndex}}).toArray((err, result) => {
                    if(err)
                        reject(err);
                    else
                    {
                        roomObjRef.msgBuffer.forEach((msg) => result.push(msg));
                        resolve({success:true,msgs:result});
                    }
                });
            };

            if(roomObjRef.dbCollection === undefined)
            {
                roomObjRef.getMessagesCollection().then((collection) => sendInitialPage(collection))
                    .catch((err) => console.log(err));
            }
            else
                sendInitialPage(roomObjRef.dbCollection);
        });
        

        return prom;
    }

    public removeUserSocket(userId: string) : boolean
    {
        /*Removes the socket used by the given user*/

        if(!this.userSockets.has(userId))
            return false;

        this.userSockets.delete(userId);
        return true;
    }

    /*******************************Functions***************************** */
    private max(x : number, y : number) : number
    {
        /*Returns the smaller of two numbers*/

        return (x < y) ? y : x;
    }

    private getMessagesCollection() : Promise<Collection>
    {
        /*Returns reference to the collection containing the messages in the room*/

        return new Promise<Collection>((resolve,reject) => {
            mongodbClient.db().collection(this.RoomId, (err, collection) => {
                if(err)
                    reject(err);
                else
                {
                    this.dbCollection = collection;
                    resolve(collection);
                }
            });
        });
    }

    private broadcastMessage(msg : {message : string, username : string}, roomObjRef : Room, senderId : string)
    {
        /*Broadcasts the message to every other socket in the room*/

        //Broadcasting the message to all the sockets in the room
        roomObjRef.userSockets.forEach((socket : Socket, userId : string) => {
            socket.emit("getMessage", msg);
        });

        //Pushing the message to buffer
        roomObjRef.msgBuffer.push(new ChatMessage(roomObjRef.roomMsgCount + roomObjRef.msgBuffer.length, msg.username, msg.message, Date()));
    }

    private saveMessages() : void
    {
        /*Saves the messages in the buffer to database*/

        const messageWritePromise : Promise<void> = new Promise((resolve) => {
            setTimeout(resolve, Room.messageWriteTimeout);
        });

        const roomObjRef : Room = this;
        messageWritePromise.then(() => {
            if(!roomObjRef.writingToDbSemaphore && roomObjRef.msgBuffer.length > 0)
            {
                console.log("Writing to database");
                roomObjRef.writeMessagesToDb(roomObjRef);
            }
            
            roomObjRef.saveMessages();
        })
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
                    {
                        //Creating index on the "index" field
                        coll.createIndex({index:1},() => resolve(coll));
                    }
                });
            });
        }
        else if(roomObjRef.dbCollection === undefined)
        {
            //Getting the required collection
            collectionPromise = roomObjRef.getMessagesCollection();
        }
        else
            collectionPromise = new Promise<any>((resolve, reject) => resolve(roomObjRef.dbCollection));
        
        //Writing the messages to the collection
        collectionPromise.then((collection) => {
            roomObjRef.dbCollection = collection;

            //Inserting chat messages to collection
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

    private getPrevPage(req : any, socket : Socket, room : Room) : void
    {
        /*Returns the previous page to the socket*/

        const startIndex : number = this.max(-1, req.firstPageIndex - Room.pageSize - 1);

        const collectionPromise : Promise<Collection> = new Promise<Collection>((resolve,reject) => {
            if(room.dbCollection !== undefined)
                resolve(room.dbCollection);
            else
            {
                room.getMessagesCollection().then((collection) => resolve(collection))
                    .catch((err) => reject(err));
            }
        });

        //Getting the pages from the database
        collectionPromise.then((collection) => {
            return collection.find({index : {$gt: startIndex}}).limit(Room.pageSize).toArray();
        })
        .then((result) => {
            socket.emit("prevPage", {success:true, msgs: result});
        })
        .catch((err) => {
            socket.emit("prevPage", {success:false, error: err});
        });
    }

    private getNextPage(req : any, socket : Socket, room : Room) : void
    {
        /*Returns the next page to the socket*/

        const collectionPromise : Promise<Collection> = new Promise<Collection>((resolve,reject) =>{
            if(room.dbCollection !== undefined)
                resolve(room.dbCollection);
            else
                room.getMessagesCollection().then((collection) => resolve(collection))
                    .catch((err) => reject(err));
        });

        //Getting the pages from the database
        collectionPromise.then((collection) => collection.find({index : {$gt: req.lastPageIndex}}).limit(Room.pageSize).toArray())
            .then((results) => {
                socket.emit("getNextPage", {success:true, msgs:results});
            })
            .catch((err) => socket.emit("getNextPage", {success:false, error:err}));
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
//Getting the pages from the database
        collectionPromise.then((collection) => {
            collection.find({index: {$gt: startIndex}}).limit(Room.pageSize).toArray()
            .then((result) => {
                socket.emit("prevPage", {success:true, msgs: result});
            })
            .catch((err) => {
                socket.emit("prevPage", {success:false, error: err});
            });
        });
*/