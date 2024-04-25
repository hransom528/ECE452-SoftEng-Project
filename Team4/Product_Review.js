const { connectDB } = require('../dbConfig.js'); 
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to retrieve product ID
async function getProductById(productId) {
  try {
    const db = await connectDB();
    const productsCollection = db.collection('products');
    const product = await productsCollection.findOne({ _id: ObjectId(productId) }); // Use ObjectId for searching by ID
    if (!product) {
      throw new Error(`Product with ID "${productId}" not found`);
    }
    return product._id; // Assuming you want to return the entire product object
  } catch (error) {
    throw error;
  }
}
// Function to retrieve userId
async function hasPurchasedProduct(userId, productId) {
  try {
    const db = await connectDB();
    const purchasesCollection = db.collection('purchases');
    const purchase = await purchasesCollection.findOne({ userId: userId, productId: productId });
    if (!purchase) {
       throw new Error(`Purchase with ID "${productId}" not found`);
    }
    return true; // Indicate purchase found (similar to returning product ID)
  } catch (error) {
    throw error;
  }
}

// Function to allow the user to give a star rating and leave a review for a product
async function reviewProduct(userId, productId, title, rating, review) {
      const product = await getProductById(productId);
      const ratingInt = parseInt(rating);
  if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
    throw new Error("Rating must be a number between 1 and 5");
  }
    
    try {
        const db = await connectDB();
        const reviewsCollection = db.collection('reviews');
        const result = await reviewsCollection.insertOne({
            userId: userId,
            productId: product,
            title: title,
            rating: rating,
            review: review,
            dateTime: new Date().toISOString()
        });
        console.log(`Review added for product "${productName}"`);
        return result.insertedId;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    hasPurchasedProduct,
    reviewProduct
};
