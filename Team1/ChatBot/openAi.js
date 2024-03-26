require("dotenv").config();
const OpenAI = require("openai");
const fs = require("fs").promises;
const { fetchAllProducts } = require("../ChatBot/fetchProducts");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getResponseFromOpenAI(prompt) {
  // waiting for products from database to be retrieved
  await fetchAllProducts();

  // Prepare your data as a stringified JSON
  const jsonData = await fs.readFile("Team1/ChatBot/products.json", "utf8");

  // Create the full prompt including instructions on how the model should respond
  const fullPrompt = `Here is some data: ${jsonData}\n\n${prompt}`;

  try {
    console.log("AI is thinking...");
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Provide concise, accurate answers based on the data provided. I want you to respond as if you are apart of our team, do not say 'based on the data inputted', instead it would be better to say something like 'based on our companies data...'. If the data does not contain the information needed to answer the question, state that the information is not available.",
        },
        {
          role: "user",
          content: fullPrompt,
        },
      ],
    });
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error("Error getting response from OpenAI:", error);
  }
}

// Replace with your actual prompt and data
// const myPrompt = "Which product has the highest price?";
const myPrompt = "What product do you think is the best for me to gain muscle?";

// Assuming you want to include myData as part of the conversation context:
getResponseFromOpenAI(myPrompt);
