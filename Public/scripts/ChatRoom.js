
/**************************Variables*********************/

/**************************Functions*********************/
function sendMsg()
{
    const msg = document.getElementById("chat_msg").value;
    console.log(msg);
    socket.emit("message", msg);
}

/**************************Script*********************/

//Connecting to the server
const socket = io("http://localhost:5000", {"transports" :["websocket","polling"]});

socket.on("message", (msg) => {
    console.log(msg);
    const msgItem = document.createElement("li");
    msgItem.innerHTML = msg;
    document.getElementById("msg_list").appendChild(msgItem);
})