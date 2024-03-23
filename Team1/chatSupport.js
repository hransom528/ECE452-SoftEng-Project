const { model } = require('./geminiConfig');

async function startChat() {
  const chat = model.startChat();

  // logic to capture chat messages and use them in the chat with Gemini
  // ex. handling an incoming message from a user and getting a response
  async function handleIncomingMessage(message) {
    try {
      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();
      return text;
    } catch (error) {
      console.error('Error during chat:', error);
      throw error;
    }
  }

  return {
    handleIncomingMessage
  };
}

module.exports = { startChat };
