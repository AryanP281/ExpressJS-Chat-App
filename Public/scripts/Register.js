
/******************************Variables******************** */
const registerUrl = "http://localhost:5000/user/addusercreds";
const profileUrl = "http://localhost:5000/profile";
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

    //Checking the response
    if(fetchResponse.status == 200)
    {
        //Getting the token
        const respData = await fetchResponse.json();

        //Saving the token in cookie
        document.cookie = `token=${respData.token}`
        
        window.location.replace(profileUrl); //Redirecting to the profile page
    }
    else
    {
        const errorMsg = await fetchResponse.json(); //Getting the error message
        //Displaying the error message
        if(errorTextP === undefined)
            errorTextP = document.querySelector(".auth_error_alert");
        errorTextP.textContent = errorMsg.error
    }

}
