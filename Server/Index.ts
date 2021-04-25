
/********************************Imports*********************/
import HTTP from "http";
import EXPRESS from "express";
import {UserApiRouter} from "./Routes/UserApi";
import {WebsiteRouter} from "./Routes/Website";
import {ChatroomApiRouter} from "./Routes/ChatroomApi"
import SOCKET from "socket.io"

/********************************Variables********************* */
const SERVER_PORT : number = (parseInt(process.env.PORT!) || 5000); //The port on which the server is run

/********************************Script********************* */

//Initializing Express
const expressApp : EXPRESS.Application = EXPRESS();
expressApp.set("port", SERVER_PORT); //Setting the app port
expressApp.use(EXPRESS.json());
expressApp.use(EXPRESS.urlencoded({extended:false})); 
expressApp.use(require("cookie-parser")());

//Setting up handlebars
expressApp.engine("handlebars", require("express-handlebars")({defaultLayout:"main"}));
expressApp.set("view engine", "handlebars");
expressApp.use(EXPRESS.static(require("path").join(__dirname,"../Public")));

//Setting express routes
expressApp.use("/user", UserApiRouter);
expressApp.use("/", WebsiteRouter);
expressApp.use("/chatroom", ChatroomApiRouter);

//Initializing http server
const httpServer : HTTP.Server = HTTP.createServer(expressApp); //Creating the http server
httpServer.listen(SERVER_PORT, () => console.log(`HTTP Server started on port ${SERVER_PORT}`));

//Initializing socket io connection
const io = new SOCKET.Server(httpServer);

//Connecting to MongoDB
import "./Config/Mongo";

//Loading the socket.io event handlers
import "./Routes/ChatApi"

/********************************Exports********************* */
export {io};
