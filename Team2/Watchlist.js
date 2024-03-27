const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const client = new MongoClient(MONGO_URI);
const dbName = 'website';
const watchlistCollection = 'watchList';

async function addToWatchList(userId, product) {
    try {
        if (!product || !product.productId) {
            throw new Error('Product is undefined or missing productId');
        }

        console.log('Adding product to watchlist:', product.productId);
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(watchlistCollection);

        await collection.updateOne(
            { userId: userId },
            { $push: { products: product.productId } }, // Push only the productId
            { upsert: true }
        );

        console.log('Product added to watchList');
    } catch (error) {
        console.error('Database operation failed:', error);
    } finally {
        await client.close();
    }
}


async function removeFromWatchList(userId, productId) {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(watchlistCollection);

        await collection.updateOne(
            { userId: userId },
            { $pull: { products: productId } }
        );

        console.log('Product removed from watchlist');
    } catch (error) {
        console.error('Database operation failed:', error);
    } finally {
        await client.close();
    }
}

async function getWatchList(userId) {
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
        return watchlist.products;
    } catch (error) {
        console.error('Database operation failed:', error);
    } finally {
        await client.close();
    }
}

module.exports = {
    getWatchList,
    removeFromWatchList,
    addToWatchList
};
