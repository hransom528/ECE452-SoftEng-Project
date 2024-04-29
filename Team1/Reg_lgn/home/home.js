document.addEventListener('DOMContentLoaded', async function () {
    const accessToken = sessionStorage.getItem('accessToken');

    if (!accessToken) {
        console.error('No access token found');
        return;  // Handle as needed (e.g., redirect to login page or show an error)
    }

    try {
        // Fetch user info from Google's API
        const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
            headers: new Headers({
                'Authorization': `Bearer ${accessToken}`  // Pass in the access token
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
        }

        const userInfo = await response.json();

        // Update the page with the user's name
        const greeting = document.getElementById('THEh4');  
        greeting.textContent = `Hi ${userInfo.name}! Welcome to our platform and thank you for choosing Gym Haven! `;

    } catch (error) {
        console.error('Error fetching user info:', error);
        // Handle error as needed (e.g., display a message or log it)
    }
});
