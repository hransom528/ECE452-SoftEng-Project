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

// Function to retrieve user's name from the "users" collection
async function getUserName(userId) {
    const db = await connectToDB();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: userId });
    return user.name;
}

// Function to allow the user to give a star rating and leave a review for a product
async function reviewProduct(userId, productId, rating, review) {
    const userName = await getUserName(userId);
    const db = await connectToDB();
    const reviewsCollection = db.collection('reviews');
    const result = await reviewsCollection.insertOne({
        userId: userId,
        productId: productId,
        userName: userName,
        rating: rating,
        review: review
    });
    console.log(`Review added for product ${productId} by user ${userName}`);
    return result.insertedId;
}

// Usage example
const userId = "user_id_here"; // Provide the actual user ID
const productId = "product_id_here"; // Provide the actual product ID
const rating = 4; // User's rating for the product (between 1 and 5)
const reviewText = "This product is amazing! Highly recommended."; // User's review for the product

reviewProduct(userId, productId, rating, reviewText)
    .then(insertedId => {
        console.log("Review inserted with ID:", insertedId);
    })
    .catch(error => {
        console.error("Error:", error);
    });

