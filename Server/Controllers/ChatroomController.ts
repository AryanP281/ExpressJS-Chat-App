
/*******************************Imports***************************/
import express from "express";
import {generateRandomString} from "../Services";
import {Socket} from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../Config/App";
import {Room} from "../Models/Room";
import roomDbModel from "../Models/RoomDbModel";

/*******************************Variables***************************/
const rooms : Map<string,Room> = new Map<string,Room>(); //The rooms mapped using the room id
const roomPublicIds : Map<string,string> = new Map<string,string>(); //The room public ids and the corresponding room ids

/*******************************Functions***************************/
function createRoom(req : express.Request, resp : express.Response)
{
    /*Creates a new room*/

    const userId : string = req.body.userId;

    //Generating public id for room
    const roomPublicId : string = generateRandomString(4);

    //Creating a db entry for the room
    const roomDbCreationPromise = roomDbModel.create({roomPublicId});
    roomDbCreationPromise.then((room) => {
        
        //Creating a room object for representing room
        const newRoom : Room = new Room(room._id.toString(), roomPublicId);
        rooms.set(newRoom.RoomId, newRoom);
        roomPublicIds.set(roomPublicId, newRoom.RoomId);

        //Generating room token
        const roomToken : string = jwt.sign(newRoom.RoomId, JWT_SECRET_KEY);

        //Adding the room token and room public id as cookie to response
        resp.cookie("roomToken", roomToken, {httpOnly:true});
        resp.cookie("roomPublicId", roomPublicId, {httpOnly:false});
        resp.status(200).json({success:true});
    })
    .catch((err) => console.log(err)); 

}

function joinRoom(req : express.Request, resp : express.Response)
{
    /*Adds the user to the given room*/
    
    const publicId : string = req.body.roomPublicId;

    //Checking if room is currently active
    const roomId : string | undefined = roomPublicIds.get(publicId);
    if(roomId === undefined)
    {
        //Check if room exists in db
        roomDbModel.findOne({roomPublicId : publicId})
            .then((roomDoc) => {
                if(!roomDoc)
                {
                    resp.json({success:false,error:"Room not found"});
                    return;
                }

                console.log("In db")

                //Opening the room
                const room : Room = new Room(roomDoc._id.toString(), publicId, roomDoc.get("roomMsgCount"));
                rooms.set(room.RoomId, room);
                roomPublicIds.set(publicId, room.RoomId);

                //Generating room token
                const roomToken : string = jwt.sign(room.RoomId, JWT_SECRET_KEY);

                //Adding the room token and public id as cookie to response
                resp.cookie("roomToken", roomToken, {httpOnly:true});
                resp.cookie("roomPublicId", req.body.roomPublicId, {httpOnly:false});
                resp.status(200).json({success:true});
            })
            .catch((err) => console.log(err));
        
        return;
    }
    
    //Generating room token
    console.log(roomId)
    const roomToken : string = jwt.sign(roomId, JWT_SECRET_KEY);

    //Adding the room token and public id as cookie to response
    resp.cookie("roomToken", roomToken, {httpOnly:true});
    resp.cookie("roomPublicId", req.body.roomPublicId, {httpOnly:false});
    resp.status(200).json({success:true});
}

function addToRoom(socket : Socket,  userId : string, roomId : string) : 
Promise<{success:boolean,error:string}> | Promise<{success:boolean,messages:any}>
{
    /*Adds the user and its socket to the require room*/

    const subscribedRoom : Room | undefined = rooms.get(roomId);
    if(subscribedRoom === undefined)
        return new Promise<any>((resolve) => resolve({success : false, error : "Room closed"}));

    const messagesPromise = subscribedRoom.addUserSocket(socket, userId);

    return messagesPromise;
}

function leaveRoom(req : express.Request, resp : express.Response)
{
    /*Leaves the given room*/

    //Clearing the client cookies
    resp.clearCookie("roomToken");
    resp.clearCookie("roomPublicId");

    resp.status(200).json({success:true});
}

function removeRoom(room : Room)
{
    /*Removes the given room*/

    rooms.delete(room.RoomId);
    roomPublicIds.delete(room.PublicId);
}

/*******************************Exports***************************/
export {createRoom, addToRoom, joinRoom, removeRoom, leaveRoom};
