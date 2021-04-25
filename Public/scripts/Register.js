
/******************************Variables******************** */
const registerUrl = "user/addusercreds";
const profileUrl = "profile";
let errorTextP = undefined;

/******************************Click Events******************** */
async function registerUser()
{
    /*Registers the user*/

    //Reading the entered data
    const email = document.getElementById("register_email").value;
    const pss = document.getElementById("register_pss").value;

    //Creating the fetch request
    const fetchResponse = await fetch(registerUrl, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({email,password:pss})
    });

    //Getting the response data
    const responseData = await fetchResponse.json();

    //Checking the response
    if(responseData.success)    
        window.location.replace(profileUrl); //Redirecting to the profile page
    else
    {
        //Displaying the error message
        if(errorTextP === undefined)
            errorTextP = document.querySelector(".auth_error_alert");
        errorTextP.textContent = responseData.error;
    }

}
