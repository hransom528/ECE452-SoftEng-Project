// watchlist.js
const { ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig');

async function getProduct(productId) {
    const db = await connectDB();
    const collection = db.collection('products');

    const product = await collection.findOne({ _id: new ObjectId(productId) }, { specs: 1 }); // Only fetch 'specs' field

    return product;
}

async function getUser(userId) {
    const db = await connectDB();
    const collection = db.collection('users');

    const user = await collection.findOne({ _id: new ObjectId(userId) });

    return user;
}

async function addToWatchlist(userId, productId) {
    const db = await connectDB();
    const collection = db.collection('users');

    const user = await getUser(userId);
    if (!user) {
        return { error: "User not found. Please log in before adding to the watchlist." };
    }

    // Fetch product details
    const product = await getProduct(productId);

    // Check if product exists
    if (!product) {
        return { error: "Product not found." };
    }

    // If user doesn't have a watchlist yet, initialize an empty array
    if (!user.watchlist) {
        user.watchlist = [];
    }

    // Add the product to the watchlist
    user.watchlist.push({
        productId,
        productName: product.name,
        spec: product.specs ? product.specs.weight : null, // Extracting weight from the specs object
        price: product.price,
        brand: product.brand,
        stockQuantity: product.stockQuantity,
        type: product.type,
        trendingScore: product.trendingScore,
        rating: product.rating
    });

    // Update the user document with the modified watchlist
    await collection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { watchlist: user.watchlist } }
    );

    return { message: "Product added to watchlist" };
}


async function removeFromWatchlist(userId, productId) {
    const db = await connectDB();
    const collection = db.collection('users');

    // Remove product from user's watchlist
    await collection.updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { watchlist: { productId } } }
    );
}

async function getWatchlist(userId) {
    const db = await connectDB();
    const collection = db.collection('users');

    const user = await getUser(userId);

    if (!user || !user.watchlist) {
        console.log('No watchlist found for this user.');
        return [];
    }

    console.log('Watchlist retrieved:', user.watchlist);

    // Fetch product details for each productId in the watchlist
    const productDetails = await Promise.all(user.watchlist.map(async ({ productId }) => {
        const product = await getProduct(productId);
        return {
            productName: product.name,
            spec: product.specs ? product.specs.weight : null, // Extracting weight from the specs object
            price: product.price,
            brand: product.brand,
            stockQuantity: product.stockQuantity,
            type: product.type,
            trendingScore: product.trendingScore,
            rating: product.rating
        };
    }));

    return productDetails;
}

module.exports = {
    getWatchlist,
    removeFromWatchlist,
    addToWatchlist,
    getProduct,
    getUser
};
