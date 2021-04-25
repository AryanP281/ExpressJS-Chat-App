
/*************************Variables*******************/
const serverSocketUrl = "http://localhost:5000";
const homeUrl = "/home";

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
io.on("Room Connection", (resp) => {
    if(!resp.success)
        window.location.replace(homeUrl);
    else
        alert("Room connection successful");
})

