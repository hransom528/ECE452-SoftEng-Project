document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('chatForm');
    form.addEventListener('submit', async function (e) {
        const accessToken = sessionStorage.getItem('accessToken');
        if (!accessToken) {
            console.log('No access token found');
            return;
        }

        e.preventDefault();  // Prevent the default form submission

        const aiPrompt = document.getElementById('aiPrompt').value;

        const postData = {
            prompt: aiPrompt
        };

        // Display loading indicator
        displayLoading();

        try {
            // Send a POST request to the server
            const response = await fetch('/talkToAI', {  // Replace with your actual endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`  // Include access token if needed
                },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('AI Response:', result);  // Handle this response properly
                displayResponse(result);  // Call a function to display this response
            } else {
                console.error('AI Request failed:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error during AI request:', error);
        }
    });
});

function displayLoading() {
    // Clear previous content
    const container = document.getElementById('responses');
    container.innerHTML = '';

    // Create a new loading div
    const loadingDiv = document.createElement('div');
    loadingDiv.id = "aiResponse";  // Assign the same ID for styling consistency
    loadingDiv.textContent = "AI is thinking...";  // Display loading message

    container.appendChild(loadingDiv);
}

function displayResponse(response) {
    const container = document.getElementById('responses');  // Assuming you have a container for responses
    container.innerHTML = '';  // Clear previous content

    const responseDiv = document.createElement('div');
    responseDiv.id = "aiResponse";  // Assigning a specific ID for styling purposes
    responseDiv.textContent = response.data || response.result;  // Modify as needed to extract the right info

    container.appendChild(responseDiv);
}
