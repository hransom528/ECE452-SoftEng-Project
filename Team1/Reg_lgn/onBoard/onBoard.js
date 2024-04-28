document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');
    form.addEventListener('submit', async function (e) {
        e.preventDefault();  // Prevent the default form submission

        const accessToken = sessionStorage.getItem('accessToken'); // Retrieve the stored access token
        if (!accessToken) {
            alert('No access token found, please log in again.');
            return;
        }

        try {
            // Fetch user info from Google's API
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
                headers: new Headers({
                    'Authorization': `Bearer ${accessToken}`
                })
            });

            const userInfo = await userInfoResponse.json();
            if (!userInfoResponse.ok) {
                throw new Error('Failed to fetch user info: ' + userInfo.error.message);
            }

            // Now gather additional data from the form
            const address = document.getElementById('address').value;
            const city = document.getElementById('city').value;
            const state = document.getElementById('state').value;
            const zip = document.getElementById('zip').value;
            const country = document.getElementById('ctry').value;
            const personal1 = document.getElementById('personal0').value;
            const personal2 = document.getElementById('personal3').value;

            // Construct the data object to send
            const userData = {
                name: userInfo.name,
                email: userInfo.email,
                address: {
                    recipientName: userInfo.name,
                    street: address,
                    city: city,
                    state: state,
                    postalCode: zip,
                    country: country,
                    isDefault: true
                },
                personal1,
                personal2
            };

            // Send the registration data to your server
            const response = await fetch('/registerUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            if (response.ok) {
                console.log('Registration successful:', result);
                window.location.href = '../home/home.html';  // Redirect to the home page
            } else {
                console.error('Registration failed:', result);
                alert('Failed to register: ' + result.message);
            }
        } catch (error) {
            console.error('Error during registration:', error);
            alert('Error: ' + error.message);
        }
    });
});
