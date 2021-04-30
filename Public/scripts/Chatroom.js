
/*************************Variables*******************/
const serverSocketUrl = "http://localhost:5000";
const homeUrl = "/home";
const msg_list_div = document.getElementById("chat_msgs_div"); //The div to display the chat messages

/*************************Funtions*******************/
function parseCookies()
{
    const parsedCookies = {}; //The parsed cookies as key value pair

    //Separating the cookies
    const separatedCookies = document.cookie.split(';');

    //Getting the cookie key and values
    separatedCookies.forEach((cookie) => {
        const keyValue = cookie.split('=');
        parsedCookies[keyValue[0].trim()] = keyValue[1];
    })

    return parsedCookies;
}

/*************************Event Handlers*******************/
function sendMessage()
{
    /*Sends the entered message*/

    //Getting the entered message
    const textBox = document.getElementById("chat_box");
    const message = textBox.value;

    //Emitting the message
    socket.emit("sendMessage", {message});

    //Clearing the text box
    textBox.value = "";
}

function displayMessage(msg)
{
    /*Displays the received message*/

    const html = `<div class="chat_msg_box">
        <span class="chat_msg_txt"> ${msg.message} </span>
    </div>
    `;

    msg_list_div.insertAdjacentHTML("beforeend", html);
}

/*************************Script*******************/

//Getting the stored cookies
const parsedCookies = parseCookies();

//Displaying the room id
document.getElementById("chatroom_id").textContent = `Room : ${parsedCookies.roomPublicId}`;

//Creating socket connection with server
const socket = io(serverSocketUrl, {
    extraHeaders: {
        authorization:parsedCookies.token
    },
    query:{
        roomToken:parsedCookies.roomToken
    }
});

//Socket connected to room
socket.on("Room Connection", (resp) => {
  
    if(!resp.success)
        window.location.replace(homeUrl);
    else
        alert("Room connection successful");
})

//Get message
socket.on("getMessage", displayMessage); 
