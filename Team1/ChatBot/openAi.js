require("dotenv").config();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getResponseFromOpenAI(prompt, data) {
  // Prepare your data as a stringified JSON
  const jsonData = JSON.stringify(data);

  // Create the full prompt including instructions on how the model should respond
  const fullPrompt = `Here is some data: ${jsonData}\n\n${prompt}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Provide concise, accurate answers based on the data provided. If the data does not contain the information needed to answer the question, state that the information is not available.",
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
const myPrompt = "Which of the products would best help me lose weight?";

const myData = [
  {
    id: "65f8e79c8c06f461ae617084",
    name: "Fitness Gear Cast Hex Dumbbell- Single",
    description: "This is a dumbbell",
    brand: "Dicks",
    type: "bench workout",
    price: 149.99,
    stockQuantity: 15,
    images: [
      "https://dks.scene7.com/is/image/GolfGalaxy/16FGEUPRGHDBNCHXXWGH?wid=2000&fmt=pjpeg",
      "https://dks.scene7.com/is/image/GolfGalaxy/STE00407_NOCOLOR_DET-alt1?wid=2000&fmt=pjpeg",
    ],
    specs: {
      weight: "150 lbs",
      color: "Black",
      material: "carbon steel",
    },
    trendingScore: 4.6,
    topTrending: true,
    rating: 4.9,
  },
  {
    id: "65f8e9f18c06f461ae617085",
    name: "Marcy 6' Chrome Bar",
    description:
      "Complete with deep threads and safety spin locks to maximize plate stability and safety during lifts, the Marcy® 6’ Chrome Bar secures standard sized weights to reduce movement and provide you with fluid performance on each exercise.",
    brand: "Marcy",
    type: "Barbell",
    price: 64.99,
    stockQuantity: 12,
    images: [
      "https://dks.scene7.com/is/image/GolfGalaxy/16MCYU6CHRMBRXXXXWBA?wid=2000&fmt=pjpeg",
      "https://dks.scene7.com/is/image/GolfGalaxy/TRB-72.2_NOCOLOR_FACE?wid=2000&fmt=pjpeg",
    ],
    specs: {
      weight: 10,
      material: "Chrome",
      color: "Silver",
    },
    trendingScore: 4.0,
    topTrending: false,
    rating: 4.3,
  },
  {
    id: "65f8ece88c06f461ae617086",
    name: "Fitness Gear Pro GHD Bench",
    description: "This is a bench",
    brand: "Dicks",
    type: "bench workout",
    price: 149.99,
    stockQuantity: 15,
    images: [
      "https://dks.scene7.com/is/image/GolfGalaxy/16FGEUPRGHDBNCHXXWGH?wid=2000&fmt=pjpeg",
      "https://dks.scene7.com/is/image/GolfGalaxy/STE00407_NOCOLOR_DET-alt1?wid=2000&fmt=pjpeg",
    ],
    specs: {
      weight: "150 lbs",
      color: "Black",
      material: "carbon steel",
    },
    trendingScore: 4.6,
    topTrending: true,
    rating: 4.9,
  },
  {
    id: "65f8f3a68c06f461ae617088",
    name: "Fitness Gear Multi-Purpose Mat",
    description:
      "The Fitness Gear® Multi-Purpose Mat helps protect floors and carpets from equipment damage and is great for a variety of floor exercises. Non-slip and easy to clean, the mat is constructed of durable 1/4 inches thick, closed cell vinyl that is safe and is virtually odorless. Fits most treadmills, elliptical machines and recumbent bikes to reduce equipment noise and vibration. Rolls up for storage convenience.",
    brand: "Fitness Gear",
    type: "Mat",
    price: 1335.99,
    stockQuantity: 50,
    images: [
      "https://dks.scene7.com/is/image/GolfGalaxy/16FGEUFGMLTPRPSXREAC_Black?wid=2000&fmt=pjpeg",
      "https://dks.scene7.com/is/image/GolfGalaxy/CFM00012_Black_DET?wid=2000&fmt=pjpeg",
    ],
    specs: {
      weight: 5,
      material: "Styrofoam",
      color: "Black",
    },
    trendingScore: 6.0,
    topTrending: false,
    rating: 332.0,
  },
];

// Assuming you want to include myData as part of the conversation context:
getResponseFromOpenAI(myPrompt + " " + JSON.stringify(myData));
