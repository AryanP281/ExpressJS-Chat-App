
/********************************Imports*********************/
import MONGOOSE from "mongoose";

/********************************Variables*********************/
const dbUrl : string = "localhost:27017"; //The mongo db url
const name : string = "ChatDB"; //The name of the mongo database
const connectionUrl : string = `mongodb://${dbUrl}/${name}`; //The url to be used for connecting with mongo db

/********************************Configuration*********************/

//Connecting to db using mongoose
MONGOOSE.connect(connectionUrl, {useNewUrlParser : true, useUnifiedTopology: true});

//DB Connected event
MONGOOSE.connection.on("connected", () => console.log("Connected to MongoDB"));

//DB disconnected event
MONGOOSE.connection.on("disconnected", () => console.log("MongoDB disconnected"));

//DB error event
MONGOOSE.connection.on("error", (err) => {
    console.log(err);
    MONGOOSE.disconnect(); //Disconnecting due to error
});