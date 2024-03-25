const fs = require("fs");
const { connectDB } = require("../../dbConfig"); // Update the path to where your connectDB module is located

async function fetchAllProducts() {
  const db = await connectDB();
  const collection = db.collection("products");

  try {
    // Fetch all products
    const products = await collection.find({}).toArray();

    // Save to a JSON file
    fs.writeFile("products.json", JSON.stringify(products, null, 2), (err) => {
      if (err) {
        console.error("Error writing to file:", err);
      } else {
        console.log("Products saved to products.json successfully!");
      }
    });
  } catch (error) {
    console.error("An error occurred while fetching products:", error);
  }
}

fetchAllProducts();
