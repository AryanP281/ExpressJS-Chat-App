
/********************Imports******************/

/********************Variables****************/
const registerUrl = "http://localhost:5000/register";
const userDetailsGetUrl = "http://localhost:5000/user/getuser";
const userDetailsUpdateUrl = "http://localhost:5000/user/updateuser";

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
            "Content-Type":"application/json"
        },
        body: JSON.stringify(user)
    });

    updateDetailsPromise.then((resp) => resp.json())
        .then((respData) => {
            //Checking if the user details were successfully updated
            if(!respData.success)
                alert(respData.error);
        })
        .catch((err) => console.log(err));
}

function setUserDetails(user)
{
    /*Displays the given user details*/ 

    //Setting the username
    document.getElementById("username_box").value = (user.username === undefined ? "" : user.username);

}

/********************Script****************/

//Getting and displaying the user details
const fetchDataPromise = fetch(userDetailsGetUrl, {
    method:"GET",
});
fetchDataPromise.then((resp) => resp.json())
    .then((data) => setUserDetails({username:data.username}))
    .catch((err) => alert(err));
