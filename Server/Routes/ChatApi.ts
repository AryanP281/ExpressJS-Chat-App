
/*******************************Imports*************************/
import {io} from "../Index"
import {connectClient} from "../Controllers/ChatController"

/*******************************Socket events*************************/
io.on("connection", connectClient);
