const { ObjectId } = require('mongodb');
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
    const product = await productsCollection.findOne({ _id: new ObjectId(productId) }); // Use ObjectId for searching by ID
    if (!product) {
      throw new Error(`Product with ID "${productId}" not found`);
    }
    return product._id; // Assuming you want to return the entire product object
  } catch (error) {
    throw error;
  }
}
// Function to retrieve userId
async function hasPurchasedProduct(userid, productId) {
  try {
    const db = await connectDB();
    const purchasesCollection = db.collection('purchases');
    const purchase = await purchasesCollection.findOne({
      userId: new ObjectId(userid),
      'items.productId': new ObjectId(productId)
    });
    if (!purchase) {
      throw new Error(`Purchase with UserID "${userid}" and Product ID "${productId}" not found`);
    }
    return true; // Indicate purchase found (similar to returning product ID)
  } catch (error) {
    throw error;
  }
}

// Function to allow the user to give a star rating and leave a review for a product
async function reviewProduct(userid, productId, title, rating, review) {
  try{
      const product = await getProductById(productId);
      await hasPurchasedProduct(userid,productId);
      const ratingInt = parseInt(rating);  
  if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
    throw new Error("Rating must be a number between 1 and 5");
  }

        const db = await connectDB();
        const reviewsCollection = db.collection('reviews');
        const result = await reviewsCollection.insertOne({
            userId: userid,
            productId: product,
            title: title,
            rating: rating,
            review: review,
            dateTime: new Date().toISOString()
        });
        console.log(`Review added for product "${productId}"`);
        return result.productId;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getProductById,
    hasPurchasedProduct,
    reviewProduct
};
