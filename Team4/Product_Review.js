// Includes dependencies
const { MongoClient } = require('mongodb');
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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

// Function to retrieve product name by ID
async function getProductNameById(productId) {
    const db = await connectToDB();
    const productsCollection = db.collection('products');
    const product = await productsCollection.findOne({ _id: productId });
    if (!product) {
        throw new Error(`Product with ID "${productId}" not found`);
    }
    return product.name;
}


// Function to allow the user to give a star rating and leave a review for a product
async function reviewProduct(productId, title, rating, review) {
    const db = await connectToDB();
    const reviewsCollection = db.collection('reviews');
    const result = await reviewsCollection.insertOne({
        productId: productId,
        title: title,
        rating: rating,
        review: review,
        dateTime: new Date().toISOString()
    });
    console.log(`Review added for product with ID ${productId}`);
    return result.insertedId;
}

// Function to gather review data from user input
async function gatherReviewData(productName) {
    return new Promise((resolve, reject) => {
        rl.question(`Enter review title for product "${productName}": `, (title) => {
            rl.question('Enter rating (1-5): ', (rating) => {
                rl.question('Enter review: ', (review) => {
                    resolve({ title, rating: parseInt(rating), review });
                });
            });
        });
    });
}

// Usage example
async function main() {
    try {
        const productId = 'your_product_id'; // Set your product ID here
        const productName = await getProductNameById(productId); // Retrieve product name from the product collection
        const reviewData = await gatherReviewData(productName);
        const insertedId = await reviewProduct(productId, reviewData.title, reviewData.rating, reviewData.review);
        console.log("Review inserted with ID:", insertedId);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        // Close readline interface and MongoDB client
        rl.close();
        await client.close();
    }
}

main();
