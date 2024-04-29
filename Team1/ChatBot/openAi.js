require("dotenv").config();
const OpenAI = require("openai");
const fs = require("fs").promises;
const { fetchAllProducts } = require("../ChatBot/fetchProducts");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getResponseFromOpenAI(body) {
  // Waiting for products from the database to be retrieved
  await fetchAllProducts();

  // Prepare data as a stringified JSON
  const jsonData = await fs.readFile("Team1/ChatBot/products.json", "utf8");

  // Creating the full prompt including instructions on how the model should respond
  const fullPrompt = `Here is some data: ${jsonData}\n\n${body.prompt}`;

  try {
    console.log("AI is thinking...");
    const response = await openai.chat.completions.create({
      // model: "gpt-3.5-turbo-1106",
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Provide concise, accurate answers based on the data provided. I want you to respond as if you are a part of our team, do not say 'based on the data inputted', instead it would be better to say something like 'based on our company's data...'. If the data does not contain the information needed to answer the question, state that the information is not available. Do not make the outputs too long.",
        },
        {
          role: "user",
          content: fullPrompt,
        },
      ],
    });
    // Ensure there's a response to return
    if (response && response.choices && response.choices.length > 0) {
      console.log("AI is done thinking!");
      return response.choices[0].message.content;
    } else {
      throw new Error("No response from OpenAI.");
    }
  } catch (error) {
    console.error("Error getting response from OpenAI:", error);
    throw error; // Rethrow the error to be caught by the caller
  }
}

// Replace with your actual prompt and data
// const myPrompt = "Which product has the highest price?";
// const myPrompt = "What product do you think is the best for me to gain muscle?";

// Assuming you want to include myData as part of the conversation context:
// getResponseFromOpenAI();
module.exports = { getResponseFromOpenAI };
