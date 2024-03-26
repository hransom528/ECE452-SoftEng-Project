const fs = require("fs");
const { connectDBandClose } = require("../../dbConfig");

async function fetchAllProducts() {
  const { db, client } = await connectDBandClose();
  const collection = db.collection("products");

  try {
    // console.log("yea ok buddy");
    // Fetch all products but exclude the _id and images fields
    const products = await collection
      .find({}, { projection: { _id: 0, images: 0 } })
      .toArray();

    // Save to a JSON file
    await new Promise((resolve, reject) => {
      fs.writeFile(
        "Team1/ChatBot/products.json",
        JSON.stringify(products, null, 2),
        (err) => {
          if (err) {
            console.error("Error writing to file:", err);
            reject(err);
          } else {
            console.log("Products saved to products.json successfully!");
            resolve();
          }
        }
      );
    });
  } catch (error) {
    console.error("An error occurred while fetching products:", error);
  } finally {
    await client.close(); // Close the client connection
    console.log("MongoDB connection closed.");
  }
}

module.exports = { fetchAllProducts };
