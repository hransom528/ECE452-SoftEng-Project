const btn = document.querySelector('#enter');

btn.onclick = function () {
    const clientID = '959740805330-3ns1eiker4f072ebs0oljlap8ovqibg7.apps.googleusercontent.com';
    const scope = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
    const redirectUri = 'http://localhost:3000/oauth2callback';
    const responseType = 'token';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientID)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${encodeURIComponent(responseType)}&scope=${encodeURIComponent(scope)}`;

    window.location = authUrl;
};

function handleAuthRedirect() {
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        if (accessToken) {
            sessionStorage.setItem('accessToken', accessToken);
            fetchUserData(accessToken);  // Fetch user data immediately after logging in

            // Clean up the URL
            history.pushState("", document.title, window.location.pathname + window.location.search);
        }
    }
}

async function fetchUserData(accessToken) {
    if (accessToken) {
        const headers = new Headers({
            'Authorization': `Bearer ${accessToken}`
        });

        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', { headers });
            const data = await response.json();
            console.log(data); // Handle user data, update UI, etc.

            // Now that we have the data, we can check if the user exists in our database
            const userInfoResponse = await fetch('http://localhost:3000/check-user', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: data.email }) // Now 'data' is defined
            });
            const userInfo = await userInfoResponse.json();
            console.log(userInfo);

            if (userInfo.exists) {
                // Redirect to the home page
                window.location.href = '../Reg_lgn/home/home.html';
                console.log(userInfo);
            } else {
                // Redirect to the registration page or some other handling
                window.location.href = '../Reg_lgn/onBoard/onBoard.html'; // Adjust the path as needed
            }
        } catch (error) {
            console.error('Error during user data fetch or user check:', error);
        }
    }
}

if (window.location.pathname === '/oauth2callback') {
    handleAuthRedirect();
} else {
    const accessToken = sessionStorage.getItem('accessToken');
    if (accessToken) {
        fetchUserData(accessToken);  // Fetch user data on subsequent page loads if the token is still stored
    }
}

