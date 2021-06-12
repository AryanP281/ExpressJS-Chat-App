
/*************************Variables*******************/
const serverSocketUrl = "http://localhost:5000";
const homeUrl = "/home";
const msg_list_div = document.getElementById("chat_msgs_div"); //The div to display the chat messages
const scrollCheckTimeout = 1000; //The time interval at which to check the scroll status
const pageLimit = 5; //The number of pixels from either end at which to start loading the next page
let paginationSemaphore = false; //A semaphore to prevent multiple page requests

let firstMsgIndex; //The index of the currently displayed 1st message
let lastMsgIndex; //The index of the currently displayed last message

const leaveRoomUrl = "/chatroom/leaveroom"; //The api endpoint to leave the current room


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

function displayMessage(msg, atEnd)
{
    /*Displays the received message*/

    const html = `<div class="chat_msg_box">
        <div class="chat_msg_title_txt"> ${msg.username}</div>
        <div class="chat_msg_txt"> ${msg.message} </div>
    </div>
    `;

    msg_list_div.insertAdjacentHTML(atEnd ? "beforeend" : "afterbegin", html);
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
            if(msg_list_div.scrollTop <= pageLimit)
            {
                paginationSemaphore = true;
                loadPrevPage();
            }
            else if(Math.abs(msg_list_div.scrollHeight - msg_list_div.scrollTop - msg_list_div.clientHeight) <= pageLimit)
            {
                //paginationSemaphore = true;
                //loadNextPage();
            }
        }

        console.log(`${msg_list_div.scrollHeight - msg_list_div.scrollTop}, ${msg_list_div.clientHeight}`);

        msgListScroll();
    })
}

function loadNextPage()
{
    /*Loads the next page of messages*/

    console.log("Loading next page");

    //Emitting the request for next page
    socket.emit("getNextPage", {lastPageIndex: currPage[currPage.length - 1].index});
}

function loadPrevPage()
{
    /*Loads the previous page of messages*/
    
    console.log(`Loading the previous page. ${firstMsgIndex}`);
    if(firstMsgIndex != 0)
    {
        //Emitting request for prevPage
        socket.emit("getPrevPage", {firstPageIndex: firstMsgIndex});
    }
}

function leaveRoom()
{
    /*Leaves the currently joined room*/

    //Disconnecting the socket
    socket.disconnect();

    //Clearing the cookies
    const leaveRoomPromise = fetch(leaveRoomUrl, {
        method: "GET"
    });
    leaveRoomPromise.then(() => {
        console.log(document.cookie)
        //Redirecting to home page
        window.location.replace(homeUrl);
    })
    .catch((err) => alert(err));
}

function sendDummyMsgs()
{
    /*Sends dummy messages. For testing and debugging purposes only*/
    
    for(let i = 0; i < 100; ++i)
    {
        socket.emit("sendMessage", {message: `Message ${i+1}`, username});
    }
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
        alert(resp.error);
    else
    {
        console.log(resp.msgs.length)
        if(resp.msgs.length > 0)
        {
            firstMsgIndex = resp.msgs[0].index;
            lastMsgIndex = resp.msgs[resp.msgs.length-1].index;
            
            //Displaying the message history
            resp.msgs.forEach((msg) => displayMessage(msg, true));
        }
        else
        {
            firstMsgIndex = -1;
            lastMsgIndex = -1;
        }

        //Handles scrolling for pagination
        msgListScroll();
    }
});

//Get message
socket.on("getMessage", (msg) => {
    displayMessage(msg, true);
    lastMsgIndex++;
});

//Get previous page
socket.on("prevPage", (page) => {

    if(page.success && page.msgs.length > 0)
    {
        firstMsgIndex = page.msgs[0].index; //Setting the new current page
        //Displaying the previous page messages
        for(let i = page.msgs.length-1; i >= 0; --i)
        {
            displayMessage(page.msgs[i], false);
        }
    }

    //Releasing the semaphore
    paginationSemaphore = false;
});

//Getting the next page
socket.on("nextPage", (page) => console.log(page));