const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const client = new MongoClient(MONGO_URI);
const dbName = 'website';
const watchlistCollection = 'watchList';

async function getProduct(productId) {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('products');

        const product = await collection.findOne({ _id: new ObjectId(productId) });

        return product;
    } catch (error) {
        console.error('Database operation failed:', error);
    } finally {
        await client.close();
    }
}

async function addToWatchlist(userId, productId) {
    try {
        console.log('Adding product to watchlist:', productId);
        await client.connect();
        const db = client.db(dbName);
        const watchlistCollection = db.collection('watchList');
        const productsCollection = db.collection('products');

        // Fetch product details
        const product = await productsCollection.findOne({ _id: new ObjectId(productId) });

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

    } catch (error) {
        console.error('Database operation failed:', error);
    } finally {
        await client.close();
    }
}

async function removeFromWatchlist(userId, productId) {
    try {
        await client.connect();
        const db = client.db(dbName);
        const watchlistCollection = db.collection('watchList');

        // Remove product from watchlist
        await watchlistCollection.updateOne(
            { userId: userId },
            { $pull: { products: productId } } 
        );

    } catch (error) {
        console.error('Database operation failed:', error);
    } finally {
        await client.close();
    }
}


async function getWatchlist(userId) {
    try {
        await client.connect();
        const db = client.db(dbName);
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
    } catch (error) {
        console.error('Database operation failed:', error);
    } finally {
        await client.close();
    }
}

module.exports = {
    getWatchlist,
    removeFromWatchlist,
    addToWatchlist
};
