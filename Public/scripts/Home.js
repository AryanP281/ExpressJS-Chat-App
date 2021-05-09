
/*****************************Variables******************/
const loginPageUrl = "/login";
const createRoomUrl = "/chatroom/createroom";
const joinRoomUrl = "/chatroom/joinroom";
const chartoomUrl = "/chat";
const logoutUrl = "user/logout";

/*****************************Functions******************/
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

function redirectToChatRoom(respData)
{
    /*Saves the tokens as cookies and redirects user to chat room*/

    //Saving the room token and public id
    document.cookie = `roomToken=${respData.roomToken};`;
    document.cookie = `roomPublicId=${respData.publicId};`;

    //Redirecting to chat window
    window.location.replace(chartoomUrl)  
}

/*****************************Event Handlers******************/
function logout()
{
    /*Logs the user out*/

    //Sending logout request
    const logoutPromise = fetch(logoutUrl, {
        method:"GET"
    });
    logoutPromise.then((resp) => resp.json())
        .then((respData) => {
            if(!respData.success)
                alert(`Failed to logout - ${resp.error}`);
            else
            {
                //Redirecting to login page
                window.location.replace(loginPageUrl)
            }
        })
        .catch((err) => console.log(err));

}

function createRoom()
{
    /*Creates a new room*/

    //Creating a fetch request for api
    const createRoomFetchPromise = fetch(createRoomUrl, {
        method:"GET",
    });

    //Resolving the promise
    createRoomFetchPromise.then((resp) => resp.json())
        .then((respData) => {

            //Checking if the room was successfully created
            if(!respData.success)
                alert("Failed to create new room - " + respData.error);
            else
                window.location.replace(chartoomUrl);
            
        })
        .catch((error) => alert(`Failed to create new room - ${error}`));

}

function joinRoom()
{
    /*Joins the room with the entered public id*/

    //Getting the eneterd public id
    const roomPublicId = document.getElementById("room_id_txtbx").value.trim();

    //Checking if the room id is empty
    if(roomPublicId.length == 0)
        alert("Enter room id to join");

    //Creating promise for api request
    const joinRoomPromise = fetch(joinRoomUrl, {
        method:"POST",
        headers: {
            "Content-Type": "application/json"
        },
        body:JSON.stringify({roomPublicId})
    });
    joinRoomPromise.then((resp) => resp.json())
        .then((respData) => {
            if(respData.success)
                window.location.replace(chartoomUrl);
            else
                alert(`Failed to join room - ${respData.error}`);
        })
        .catch((err) => alert(err))
}

