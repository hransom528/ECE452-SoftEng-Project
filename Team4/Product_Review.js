// Includes dependencies
const { MongoClient } = require('mongodb');
const assert = require("assert");

// TODO: Change MongoDB URI to secret
const MONGO_URI = "mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(MONGO_URI);

// Database Name
const dbName = 'website';

// Function to connect to MongoDB
async function connectToDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db(dbName);
        return db;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
}

// Function to retrieve product ID from the "products" collection by product name
async function getProductIdByName(productName) {
    const db = await connectToDB();
    const productsCollection = db.collection('products');
    const product = await productsCollection.findOne({ name: productName });
    return product._id;
}

// Function to allow the user to give a star rating and leave a review for a product
async function reviewProduct(productName, title, rating, review) {
    const productId = await getProductIdByName(productName);
    const db = await connectToDB();
    const reviewsCollection = db.collection('reviews');
    const result = await reviewsCollection.insertOne({
        productId: productId,
        title: title,
        rating: rating,
        review: review,
        dateTime: new Date().toISOString()
    });
    console.log(`Review added for product ${productName}`);
    return result.insertedId;
}

// Sample review data
const reviewData = {
    productName: "barbell", // Product name
    title: "Pretty Mediocre Barbell", // Review title
    rating: 3, // Rating (between 1 and 5)
    review: "Hard to grip onto, but still did its job. You get what you pay for." // Review comment
};

// Usage example
reviewProduct(reviewData.productName, reviewData.title, reviewData.rating, reviewData.review)
    .then(insertedId => {
        console.log("Review inserted with ID:", insertedId);
    })
    .catch(error => {
        console.error("Error:", error);
    });
