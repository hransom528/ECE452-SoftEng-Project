require('dotenv').config();
const fetch = require('node-fetch');

// Assuming you have an API like Bard for handling customer service
const BARD_API_ENDPOINT = process.env.BARD_API_ENDPOINT;
const BARD_API_KEY = process.env.BARD_API_KEY;

// Function to handle customer questions
async function handleCustomerQuestion(question) {
  try {
    const response = await fetch(BARD_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BARD_API_KEY}`
      },
      body: JSON.stringify({ prompt: question })
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.reply; // Assuming 'reply' is the attribute containing the AI response
  } catch (error) {
    console.error('Error handling customer question:', error);
    throw error; // Rethrow the error for the calling function to handle
  }
}

// Export the function for use in other parts of your application, like your API endpoint handlers
module.exports = { handleCustomerQuestion };
