
/*******************************Imports***************************/
import express from "express";
import {generateRandomString} from "../Services"
import {Socket} from "socket.io"
import jwt from "jsonwebtoken"
import { JWT_SECRET_KEY } from "../Config/App";

/*******************************Variables***************************/
const userSubscriptions : Map<string,string> = new Map<string,string>(); //The room each user has subscribed to
const roomPublicIds : Map<string,string> = new Map<string,string>(); //The public ids to be used for joining rooms
const rooms : Map<string,Map<string,Socket>> = new Map<string,Map<string,Socket>>(); /*A map containing the room ids and the socket connections
with users in the rooms*/
const socketInfo : Map<Socket,any> = new Map<Socket,any>(); //Stores the info associated with each socket 

/*******************************Functions***************************/
function createRoom(req : express.Request, resp : express.Response)
{
    /*Creates a new room*/

    //Checking if the user is already subscribed to a room
    const userId : string = req.body.userId;
    if(userSubscriptions.has(userId))
    {
        //Removing the user from the old room
        
        const userOldRoomId : string = userSubscriptions.get(userId)!;
        rooms.get(userOldRoomId)?.delete(userId);
    }
    userSubscriptions.delete(userId);

    //Generating an id for the room
    let newRoomId : string; //The id of the new room
    do
    {
        newRoomId = generateRandomString(4);
    }
    while(rooms.has(newRoomId));

    //Generating public id for the room
    let publicId : string; //The public id of the room
    do
    {
        publicId = generateRandomString(4);
    }
    while(roomPublicIds.has(publicId));
    roomPublicIds.set(publicId, newRoomId);

    userSubscriptions.set(userId, newRoomId); //Setting the new subscribed room for the user
    rooms.set(newRoomId, new Map()); //Creating the room entry in the room-socket map

    //Generating room token
    const roomToken : string = jwt.sign(newRoomId, JWT_SECRET_KEY);

    //Adding the room token and room public id as cookie to response
    resp.cookie("roomToken", roomToken, {httpOnly:true});
    resp.cookie("roomPublicId", publicId, {httpOnly:false});
    resp.status(200).json({success:true});

}

function joinRoom(req : express.Request, resp : express.Response)
{
    /*Adds the user to the given room*/
    
    const userId : string = req.body.userId;

    //Checking if the user is already subscribed to a room
    if(userSubscriptions.has(userId))
    {
        //Removing the user from the old room
        
        const userOldRoomId : string = userSubscriptions.get(userId)!;
        rooms.get(userOldRoomId)?.delete(userId);
    }

    //Checking if the room exists
    const roomId : string | undefined = roomPublicIds.get(req.body.roomPublicId);
    if(roomId === undefined)
    {    
        resp.json({success:false,error:"Room not found"});
        return;
    }

    userSubscriptions.set(userId, roomId); //Setting the user's subscribed room

    //Generating room token
    const roomToken : string = jwt.sign(roomId, JWT_SECRET_KEY);

    //Adding the room token and public id as cookie to response
    resp.cookie("roomToken", roomToken, {httpOnly:true});
    resp.cookie("roomPublicId", req.body.roomPublicId, {httpOnly:false});
    resp.status(200).json({success:true});

}

function addToRoom(socket : Socket, roomId : string, userId : string, roomPublicId: string)
{
    /*Adds the user and its socket to the require room*/

    //Adding the socket to the room
    rooms.get(roomId)!.set(userId, socket);

    //Saving the socket info
    socketInfo.set(socket, {userId, roomId, roomPublicId});

    //Setting the send message event for the socket
    socket.on("sendMessage", (msg) => sendMessage(socket,msg));

    //Setting the disconnect event for the socket
    socket.on("disconnect", () => onSocketDisconnect(socket));
}

function onSocketDisconnect(socket : Socket)
{
    /*Handles the disconnecting of sockets*/

    console.log(rooms)
    console.log(userSubscriptions)
    console.log(roomPublicIds)

    console.log(`Socket ${socket.id} Disconnected`);

    //Getting the socket info
    const info : any = socketInfo.get(socket);

    //Removing the user
    userSubscriptions.delete(info.userId);

    //Removing the socket from the room
    const roomConnections : Map<string,Socket> = rooms.get(info.roomId)!; //Getting the connections for the room
    roomConnections.delete(info.userId);
    if(!roomConnections.size)
        deleteRoom(info.roomId, info.roomPublicId);

    console.log(rooms)
    console.log(userSubscriptions)
    console.log(roomPublicIds)
}

function deleteRoom(roomId : string, roomPublicId : string)
{
    /*Removes the data associated with the given room*/

    rooms.delete(roomId);
    roomPublicIds.delete(roomPublicId);
    
}

function sendMessage(socket : Socket, msg : {message : string})
{
    /*Broadcasts the message sent by the socket to all the sockets connected to its room*/

    //Getting the socket info
    const info : any = socketInfo.get(socket);

    //Getting all the connections to the room
    const roomConnections : [string,Socket][] = Array.from(rooms.get(info.roomId)!);

    //Broadcasting the message to all connections
    for(let i = 0; i < roomConnections.length; ++i)
    {
        roomConnections[i][1].emit("getMessage", {message : msg.message});
    }

}

/*******************************Exports***************************/
export {createRoom, addToRoom, joinRoom};
