
/***************************Imports**********************/
import EXPRESS from "express";
import HTTP from "http";
import SOCK from "socket.io"
import {expressRouter} from "./Webpage";
import {setIoEvents} from "./Socket";
import PATH from "path";
import EXPHBS from "express-handlebars";

/***************************Imports**********************/
const PORT : number = parseInt(process.env.PORT!) || 5000; //The port number on which the server is run 

/**************************Server Initialization*********************/

//Initializing Express
const app : EXPRESS.Application = EXPRESS(); //Initializing the express app
app.set("port", PORT); //Setting the server port
app.use("/", expressRouter); //Setting the web routing for the express webpage
app.use(EXPRESS.static(PATH.join(__dirname, "../Public"))); //Setting the static folder
app.engine("handlebars", EXPHBS({defaultLayout:"main"})); //Setting the rendering engine
app.set("view engine", "handlebars");

//Initializing the http server
const httpServer = HTTP.createServer(app); //Creating the http server

//Initializing socket.io
const io = new SOCK.Server(httpServer, {"transports" :["websocket","polling"]}); //Creating the socket.io server

/**************************Server Initialization*********************/

//Setting the socket.io events
setIoEvents(io);

//Starting the http server
httpServer.listen(PORT, () => console.log("Http Server Listening on Port " + PORT));

/**************************Exports*********************/


