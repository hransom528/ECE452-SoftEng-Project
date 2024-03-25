require('dotenv').config();

const {VertexAI} = require('@google-cloud/vertexai');
const { create } = require('domain');

/**
 * TODO(developer): Update these variables before running the sample.
 */
async function createStreamChat(
  projectId = 'gym-haven',
  location = 'us-central1',
  model = 'gemini-1.0-pro'
) {
  // Initialize Vertex with your Cloud project and location
  const vertexAI = new VertexAI({project: projectId, location: location});

  // Instantiate the model
  const generativeModel = vertexAI.getGenerativeModel({
    model: model,
  });

  const chat = generativeModel.startChat({});
  const products = [
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
        "https://dks.scene7.com/is/image/GolfGalaxy/STE00407_NOCOLOR_DET-alt1?wid=2000&fmt=pjpeg"
      ],
      specs: {
        weight: "150 lbs",
        color: "Black",
        material: "carbon steel"
      },
      trendingScore: 4.6,
      topTrending: true,
      rating: 4.9
    },
    {
      id: "65f8e9f18c06f461ae617085",
      name: "Marcy 6' Chrome Bar",
      description: "Complete with deep threads and safety spin locks to maximize plate stability and safety during lifts, the Marcy® 6’ Chrome Bar secures standard sized weights to reduce movement and provide you with fluid performance on each exercise.",
      brand: "Marcy",
      type: "Barbell",
      price: 64.99,
      stockQuantity: 12,
      images: [
        "https://dks.scene7.com/is/image/GolfGalaxy/16MCYU6CHRMBRXXXXWBA?wid=2000&fmt=pjpeg",
        "https://dks.scene7.com/is/image/GolfGalaxy/TRB-72.2_NOCOLOR_FACE?wid=2000&fmt=pjpeg"
      ],
      specs: {
        weight: 10,
        material: "Chrome",
        color: "Silver"
      },
      trendingScore: 4.0,
      topTrending: false,
      rating: 4.3
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
        "https://dks.scene7.com/is/image/GolfGalaxy/STE00407_NOCOLOR_DET-alt1?wid=2000&fmt=pjpeg"
      ],
      specs: {
        weight: "150 lbs",
        color: "Black",
        material: "carbon steel"
      },
      trendingScore: 4.6,
      topTrending: true,
      rating: 4.9
    },
    {
      id: "65f8f3a68c06f461ae617088",
      name: "Fitness Gear Multi-Purpose Mat",
      description: "The Fitness Gear® Multi-Purpose Mat helps protect floors and carpets from equipment damage and is great for a variety of floor exercises. Non-slip and easy to clean, the mat is constructed of durable 1/4 inches thick, closed cell vinyl that is safe and is virtually odorless. Fits most treadmills, elliptical machines and recumbent bikes to reduce equipment noise and vibration. Rolls up for storage convenience.",
      brand: "Fitness Gear",
      type: "Mat",
      price: 1335.99,
      stockQuantity: 50,
      images: [
        "https://dks.scene7.com/is/image/GolfGalaxy/16FGEUFGMLTPRPSXREAC_Black?wid=2000&fmt=pjpeg",
        "https://dks.scene7.com/is/image/GolfGalaxy/CFM00012_Black_DET?wid=2000&fmt=pjpeg"
      ],
      specs: {
        weight: 5,
        material: "Styrofoam",
        color: "Black"
      },
      trendingScore: 6.0,
      topTrending: false,
      rating: 332.0
    }
  ];
  
  const prompt = JSON.stringify({
    prompt: "Give me the list of products that are topTrending",
    data: products
  });
  
  
//   console.log(`User ${prompt}`);
  const chatInput1 = prompt;


//   console.log(`User: ${chatInput1}`);

  const result1 = await chat.sendMessageStream(chatInput1);
  for await (const item of result1.stream) {
    console.log(item.candidates[0].content.parts[0].text);
  }
}

createStreamChat().catch(console.error)

// const {VertexAI} = require('@google-cloud/vertexai');
// // const aiplatform = require('@google-cloud/aiplatform');
// // const {helpers} = aiplatform;

// // TODO: Replace with your project information
// const projectId = 'gym-haven';
// const location = 'us-central1';
// // Specify the model you want to use
// const model = 'text-bison@002'; // e.g., 'text-bison@001' or any other model you have access to

// // Initialize Vertex AI with your project and location
// const vertexAI = new VertexAI({project: projectId, location: location});

// // Instantiate the model
// const generativeModel = vertexAI.getGenerativeModel({ model: model });

// async function callModelWithPrompt() {
//   // Define your prompt and data here
//   const prompt = {
//     prompt: "Give me the top 2 oldest people based on our data:",
//     data: [
//       { name: "John Doe", age: 30, occupation: "Software Engineer", hobbies: ["programming", "hiking", "reading"] },
//       { name: "Alice Smith", age: 28, occupation: "Data Scientist", hobbies: ["painting", "traveling", "yoga"] },
//       { name: "Bob Johnson", age: 35, occupation: "Teacher", hobbies: ["gardening", "cooking", "playing guitar"] }
//     ]
//   };

//   // Convert your data to a format that the model can process
//   console.log(prompt);
// //   const instanceValue = VertexAI.helpers.toValue(prompt);
//   const instances = [prompt];

//   const request = {
//     endpoint: `projects/${projectId}/locations/${location}/models/${model}`,
//     instances: instances,
//   };

//   // Make the prediction request to the model
//   const [response] = await generativeModel.predict(request);

//   // Process and log the response
//   console.log('AI response:');
//   console.log(response);
// }

// callModelWithPrompt().catch(console.error);
