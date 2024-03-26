
const { MongoClient } = require('mongodb');
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


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


// Function to allow the user to give a star rating and leave a review for a product
async function reviewProduct(productId, title, rating, review) {
    const db = await connectToDB();
    const productsCollection = db.collection('products');
    const product = await productsCollection.findOne({ name: productName });
    if (!product) {
        throw new Error(`Product "${productName}" not found`);
    }
    const reviewsCollection = db.collection('reviews');
    const result = await reviewsCollection.insertOne({
        productName: productName,
        title: title,
        rating: rating,
        review: review,
        dateTime: new Date().toISOString()
    });
    console.log(`Review added for product with ID ${productId}`);
    return result.insertedId;
}

// Function to gather review data from user input
async function gatherReviewData() {
    return new Promise(async (resolve, reject) => {
        try {
            const productName = await askForProductName();
            const productId = await getProductIdByName(productName);
            rl.question(`Enter review title for product "${productId}": `, (title) => {
                rl.question('Enter rating (1-5): ', async (rating) => {
                    const ratingInt = parseInt(rating);
                    if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
                        reject(new Error("Rating must be a number between 1 and 5"));
                        return;
                    }
                    rl.question('Enter review: ', (review) => {
                        resolve({ title, rating: ratingInt, review });
                    });
                });
            });
        } catch (error) {
            reject(error);
        }
    });
}

async function askForProductName() {
    return new Promise((resolve, reject) => {
        rl.question('Enter the name of the product you want to review: ', (productName) => {
            resolve(productName);
        });
    });
}

// Usage example
async function main() {
    try {
        await connectToDB();
        const productName = await askForProductName();
        const reviewData = await gatherReviewData();
        const insertedId = await reviewProduct(productName, reviewData.title, reviewData.rating, reviewData.review);
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
