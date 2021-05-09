
/*******************************Imports***************************/
import express from "express";
import {generateRandomString} from "../Services";
import {Socket} from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../Config/App";
import {Room} from "../Models/Room";

/*******************************Variables***************************/
const rooms : Map<string,Room> = new Map<string,Room>(); //The rooms mapped using the room id
const roomPublicIds : Map<string,string> = new Map<string,string>(); //The room public ids and the corresponding room ids

/*******************************Functions***************************/
function createRoom(req : express.Request, resp : express.Response)
{
    /*Creates a new room*/

    const userId : string = req.body.userId;

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
    roomPublicIds.set(publicId,newRoomId);

    //Creating the room object
    const newRoom : Room = new Room(newRoomId, publicId, userId);
    rooms.set(newRoomId, newRoom); //Adding the room to the list of rooms

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

    //Checking if the room exists
    const roomId : string | undefined = roomPublicIds.get(req.body.roomPublicId);
    if(roomId === undefined)
    {    
        resp.json({success:false,error:"Room not found"});
        return;
    }

    //Generating room token
    const roomToken : string = jwt.sign(roomId, JWT_SECRET_KEY);

    //Adding the room token and public id as cookie to response
    resp.cookie("roomToken", roomToken, {httpOnly:true});
    resp.cookie("roomPublicId", req.body.roomPublicId, {httpOnly:false});
    resp.status(200).json({success:true});

}

function addToRoom(socket : Socket,  userId : string, roomId : string) : {success : boolean, error : string}
{
    /*Adds the user and its socket to the require room*/

    const subscribedRoom : Room | undefined = rooms.get(roomId);
    if(subscribedRoom === undefined)
        return {success : false, error : "Room closed"};

    subscribedRoom.addUserSocket(socket, userId);

    return {success : true, error : ""};
}

function leaveRoom(req : express.Request, resp : express.Response)
{
    /*Leaves the given room*/

    
}

function removeRoom(room : Room)
{
    /*Removes the given room*/

    rooms.delete(room.roomId);
    roomPublicIds.delete(room.roomPublicId);
}

/*******************************Exports***************************/
export {createRoom, addToRoom, joinRoom, removeRoom};