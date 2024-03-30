const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const client = new MongoClient(MONGO_URI);
const dbName = 'website';
const watchlistCollection = 'watchList';

async function addToWatchList(userId, productId) {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(watchlistCollection);

        await collection.updateOne(
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

async function removeFromWatchList(userId, productId) {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(watchlistCollection);

        await collection.updateOne(
            { userId: userId },
            { $pull: { products: productId } } 
        );

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