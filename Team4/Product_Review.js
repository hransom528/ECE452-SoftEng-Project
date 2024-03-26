const { connectDB } = require('../dbConfig.js'); 
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to retrieve product ID by name
async function getProductByName(productName) {
    try {
        const db = await connectDB();
        const productsCollection = db.collection('products');
        const product = await productsCollection.findOne({ name: productName });
        if (!product) {
            throw new Error(`Product "${productName}" not found`);
        }
        return product.name;
    } catch (error) {
        throw error;
    }
}

// Function to allow the user to give a star rating and leave a review for a product
async function reviewProduct(productName, title, rating, review) {
    try {
        const db = await connectDB();
        const reviewsCollection = db.collection('reviews');
        const result = await reviewsCollection.insertOne({
            productName: productName,
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

// Function to gather review data from user input
async function gatherReviewData() {
    return new Promise(async (resolve, reject) => {
        try {
            const productName = await askForProductName();
            const productId = await getProductByName(productName);
            rl.question(`Enter review title for product "${productId}": `, (title) => {
                rl.question('Enter rating (1-5): ', async (rating) => {
                    const ratingInt = parseInt(rating);
                    if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
                        reject(new Error("Rating must be a number between 1 and 5"));
                        return;
                    }
                    rl.question('Enter review: ', (review) => {
                        resolve({ productName, title, rating: ratingInt, review });
                    });
                });
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Function to gather product name from user input
async function askForProductName() {
    return new Promise((resolve, reject) => {
        rl.question('Enter the name of the product you want to review: ', (productName) => {
            resolve(productName);
        });
    });
}

module.exports = {
    getProductByName,
    reviewProduct,
    gatherReviewData,
    askForProductName
};
