
/*************************Variables*******************/
const serverSocketUrl = "http://localhost:5000";
const homeUrl = "/home";
const msg_list_div = document.getElementById("chat_msgs_div"); //The div to display the chat messages
const scrollCheckTimeout = 1000; //The time interval at which to check the scroll status
let paginationSemaphore = false; //A semaphore to prevent multiple page requests

let currPage;
let nextPage;

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
    socket.emit("sendMessage", {message, username});

    //Clearing the text box
    textBox.value = "";
}

function displayMessage(msg)
{
    /*Displays the received message*/

    const html = `<div class="chat_msg_box">
        <div class="chat_msg_title_txt"> ${msg.username}</div>
        <div class="chat_msg_txt"> ${msg.message} </div>
    </div>
    `;

    msg_list_div.insertAdjacentHTML("beforeend", html);
}

function msgListScroll()
{
    /*Handles the message list scroll event*/

    const scrollCheckPromise = new Promise((resolve) => {
        setTimeout(resolve, scrollCheckTimeout);
    }); //The promise to check the scroll status after the given timeout period 
    
    scrollCheckPromise.then(() => {
        
        //Checking the scroll status
        if(!paginationSemaphore)
        {
            if(msg_list_div.scrollTop <= 200)
            {
                paginationSemaphore = false;
                loadPrevPage();
            }
            else if(Math.abs(msg_list_div.scrollHeight - msg_list_div.scrollTop - msg_list_div.clientHeight) <= 200)
            {
                paginationSemaphore = true;
                loadNextPage();
            }
        }

        console.log(`${msg_list_div.scrollHeight - msg_list_div.scrollTop}, ${msg_list_div.clientHeight}`);


        msgListScroll();
    })
}

function loadNextPage()
{
    /*Loads the next page of messages*/

    console.log("Loading Next Page");
    paginationSemaphore = false;
}

function loadPrevPage()
{
    /*Loads the previous page of messages*/

    console.log("Loading the previous page");
    paginationSemaphore = false;
}

function leaveRoom()
{
    /*Leaves the currently joined room*/

    
}

/*************************Script*******************/

//Getting the stored cookies
const parsedCookies = parseCookies();

//Getting the username
const username = decodeURIComponent(parsedCookies.username);

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
        console.log(resp)
    else
    {
        console.log(resp)
        //Displaying the message history
        resp.msgs.forEach((msg) => displayMessage(msg));
    }
});

//Get message
socket.on("getMessage", displayMessage); 

//Handles scrolling for pagination
msgListScroll();