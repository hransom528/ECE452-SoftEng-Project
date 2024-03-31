// watchlist.js
const { ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig');

const watchlistCollection = 'watchList';

async function getProduct(productId) {
    const db = await connectDB();
    const collection = db.collection('products');

    const product = await collection.findOne({ _id: new ObjectId(productId) });

    return product;
}

async function addToWatchlist(userId, productId) {
    const db = await connectDB();
    const watchlistCollection = db.collection('watchList');
    const productsCollection = db.collection('products');

    // Fetch product details
    const product = await getProduct(productId);

    // Check if product exists
    if (!product) {
        console.log('Product not found.');
        return;
    }

    // Add product to watchlist
    await watchlistCollection.updateOne(
        { userId: userId },
        { $addToSet: { products: productId } },
        { upsert: true }
    );
}

async function removeFromWatchlist(userId, productId) {
    const db = await connectDB();
    const watchlistCollection = db.collection('watchList');

    // Remove product from watchlist
    await watchlistCollection.updateOne(
        { userId: userId },
        { $pull: { products: productId } }
    );
}

async function getWatchlist(userId) {
    const db = await connectDB();
    const collection = db.collection(watchlistCollection);

    const watchlist = await collection.findOne({ userId: userId });

    if (!watchlist) {
        console.log('No watchlist found for this user.');
        return [];
    }

    console.log('Watchlist retrieved:', watchlist.products);

    // Fetch product details for each productId in the watchlist
    const productDetails = await Promise.all(watchlist.products.map(productId => getProduct(productId)));

    return productDetails;
}

module.exports = {
    getWatchlist,
    removeFromWatchlist,
    addToWatchlist
};
