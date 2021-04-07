
/********************Imports******************/

/********************Variables****************/
const registerUrl = "http://localhost:5000/register";
const userDetailsGetUrl = "http://localhost:5000/user/getuser";
const userDetailsUpdateUrl = "http://localhost:5000/user/updateuser";
const token = document.cookie.split('=')[1];

/********************Functions****************/
function updateDetails()
{
    /*Updates the user details*/

    //Getting the entered details
    const user = {username:document.getElementById("username_box").value};

    //POST request for updating the user details
    const updateDetailsPromise = fetch(userDetailsUpdateUrl, {
        method:"POST",
        headers:{
            "x-access-token":token,
            "Content-Type":"application/json"
        },
        body: JSON.stringify(user)
    });

    updateDetailsPromise.then((resp) => alert("UPDATED"))
        .catch((err) => console.log(err));
}

function setUserDetails(user)
{
    /*Displays the given user details*/ 

    //Setting the username
    document.getElementById("username_box").value = user.username;

}

/********************Script****************/

//Checking if user is logged in
if(token === undefined)
    document.location.replace(registerUrl);

//Getting and displaying the user details
const fetchDataPromise = fetch(userDetailsGetUrl, {
    method:"GET",
    headers:{
        "x-access-token":token
    }
});
fetchDataPromise.then((resp) => resp.json())
    .then((data) => setUserDetails(data.user))
    .catch((err) => alert("err"));
