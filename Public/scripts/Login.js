
/*****************************Variables******************/
const regex = new RegExp("(.)+(@)(\\D)+(\.)(\\D)+"); //The regex to be used for checking the email format
const loginUrl = "user/login";
const homeUrl = "/home"; //The url to the home page

/*****************************Event Handlers******************/
function loginUser()
{
    const creds = getEnteredCreds();

    //Checking if the correct creds were entered
    if(creds === undefined)
        return;

    //Sending the login request
    const loginPromise = fetch(loginUrl, {
        method:"POST",
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(creds)
    });

    loginPromise.then((resp) => resp.json())
        .then((data) => {
            if(!data.success)
                displayErrorMessage(data.error);
            else
            {
                //Saving the token as cookie and redirecting
                //document.cookie = `token=${data.token}`;
                window.location.replace(homeUrl);
            }
        })
        .catch((err) => console.log(err));
}

/*****************************Functions******************/

function getEnteredCreds()
{
    /*Returns the credentials entered by the user*/

    const email = document.getElementById("login_email").value;
    const pss = document.getElementById("login_pss").value;

    if(validInput(email,pss))
        return {email,password:pss};

    displayErrorMessage("Invalid email or password");
    return undefined
}

function validInput(email,pss)
{
    /*Checks if the given input creds are valid*/

    email = email.trim();
    pss = pss.trim();

    return (regex.test(email) && pss.length >= 6);
}

function displayErrorMessage(msg)
{
    /*Displays the given error message*/

    document.querySelector(".auth_error_alert").textContent = msg;
}
