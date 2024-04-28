// watchlist.js
const { ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig');
const { getUserInfo } = require('../Team1/Reg_lgn/oAuthHandler');

async function getProduct(productId) {
    const db = await connectDB();
    const collection = db.collection('products');
    const product = await collection.findOne({ _id: new ObjectId(productId) }, { specs: 1 }); // Only fetch 'specs' field
    return product;
}

async function getUser(token) {
    // Assuming getUserInfo extracts user information from the token
    const user = await getUserInfo(token); // Implement this according to your token structure
    return user;
}

async function addToWatchlist(token, productName) {
    const user = await getUser(token);
    if (!user) {
        return { error: "User not found. Please log in before adding to the watchlist." };
    }

    const db = await connectDB();
    const productCollection = db.collection('products');
    const userCollection = db.collection('users');

    // Find the product by name
    const product = await productCollection.findOne({ name: productName });
    if (!product) {
        return { error: "Product not found." };
    }

    // Check if the product is already in the user's watchlist
    const userWatchlist = await userCollection.findOne({ email: user.email });
    if (userWatchlist && userWatchlist.watchlist && userWatchlist.watchlist.some(item => item.name === productName)) {
        return { error: "Product already in watchlist" };
    }

    console.log("Adding product to watchlist:", product);

    // Update the user's watchlist directly in the database
    await userCollection.updateOne(
        { email: user.email }, // Assuming email is a unique identifier for users
        { 
            $addToSet: { 
                watchlist: { 
                    name: product.name,
                    description: product.description,
                    brand: product.brand,
                    type: product.type,
                    price: product.price,
                    stockQuantity: product.stockQuantity,
                    specs: product.specs,
                    trendingScore: product.trendingScore,
                    rating: product.rating,
                    discount: product.discount,
                    originalPrice: product.originalPrice
                } 
            } 
        }
    );

    return { message: "Product added to watchlist" };
}



async function removeFromWatchlist(token, productName) {
    const user = await getUser(token);
    if (!user) {
        return { error: "User not found." };
    }

    const db = await connectDB();
    const userCollection = db.collection('users');

    // Find the product by name
    const product = await userCollection.findOne({ email: user.email, 'watchlist.name': productName }, { 'watchlist.$': 1 });
    if (!product) {
        return { error: "Product not found in watchlist." };
    }

    // Remove the product from the user's watchlist
    await userCollection.updateOne(
        { email: user.email },
        { $pull: { watchlist: { name: productName } } }
    );

    return { message: "Product removed from watchlist" };
}



async function getWatchlist(userInfo) {
    if (!userInfo) {
        return { error: "User not found." };
    }

    const db = await connectDB();
    const collection = db.collection('users');

    // Find the user document based on email or name
    const user = await collection.findOne({ email: userInfo.email });
    if (!user) {
        return { error: "User not found." };
    }

    const watchlist = user.watchlist;

    if (!watchlist) {
        return { error: "Watchlist not found for this user." };
    }

    return watchlist;
}




module.exports = {
    getWatchlist,
    removeFromWatchlist,
    addToWatchlist,
    getProduct,
    getUser
};
