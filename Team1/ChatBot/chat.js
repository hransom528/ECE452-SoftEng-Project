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
    const container = document.getElementById('responses');  // Container for responses
    container.innerHTML = '';  // Clear previous content

    const responseText = response.data || response.result;  // Extract response content

    // Convert the response content to HTML manually
    let htmlContent = responseText
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")  // Bold text (**text**)
        .replace(/__(.*?)__/g, "<em>$1</em>")  // Italic text (__text__)
        .replace(/\*(.*?)\*/g, "<em>$1</em>")  // Italic text (*text*)
        .replace(/^- (.*?)$/gm, "<li>$1</li>")  // Bulleted list item (- item)
        .replace(/\n<li>/g, "<ul><li>")  // Wrap list items
        .replace(/<\/li>\n/g, "</li></ul>\n");  // Close list

    // Create a new div to hold the formatted HTML content
    const responseDiv = document.createElement('div');
    responseDiv.id = "aiResponse";  // ID for styling consistency
    responseDiv.innerHTML = htmlContent;  // Assign the converted HTML content

    container.appendChild(responseDiv);
}
