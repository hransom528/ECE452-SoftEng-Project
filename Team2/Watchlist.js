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

async function getUser(userId) {
    const db = await connectDB();
    const collection = db.collection('users');

    const user = await collection.findOne({ _id: new ObjectId(userId) });

    return user;
}

async function addToWatchlist(userId, productId) {
    const db = await connectDB();
    const watchlistCollection = db.collection('watchList');

    const user = await getUser(userId);
    if (!user) {
        return { error: "User not found. Please log in before adding to the watchlist." };

    }
    else{
    // Fetch product details
    const product = await getProduct(productId);

    // Check if product exists
    if (!product) {
        return { error: "Product not found." };

    }

    const existingWatchlist = await watchlistCollection.findOne({ userId: userId });
    if (existingWatchlist && existingWatchlist.products.some(item => item.productId === productId)) {
        return { message: "Product is already in the watchlist." };

    }
    // Add product to watchlist with additional details
    await watchlistCollection.updateOne(
        { userId: userId },
        { 
            $addToSet: { 
                products: { 
                    productId, 
                    productName: product.name,
                    spec: product.spec,
                    price: product.price,
                    brand: product.brand,
                    stockQuantity: product.stockQuantity,
                    type: product.type,
                    trendingScore: product.trendingScore,
                    rating: product.rating
                } 
            } 
        },
        { upsert: true }
    );
    return { message: "Product added to watchlist" };

}

}

async function removeFromWatchlist(userId, productId) {
    const db = await connectDB();
    const watchlistCollection = db.collection('watchList');

    // Remove product from watchlist
    await watchlistCollection.updateOne(
        { userId: userId },
        { $pull: { products: { productId } } }
    );
}

async function getWatchlist(userId) {
    const db = await connectDB();
    const watchlistCollection = db.collection('watchList');

    const watchlist = await watchlistCollection.findOne({ userId: userId });

    if (!watchlist) {
        console.log('No watchlist found for this user.');
        return [];
    }

    console.log('Watchlist retrieved:', watchlist.products);

    // Fetch product details for each productId in the watchlist
    const productDetails = await Promise.all(watchlist.products.map(async ({ productId }) => {
        const product = await getProduct(productId);
        return { 
            productName: product.name,
            spec: product.spec,
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
