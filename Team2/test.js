const mongoose = require('mongoose');
const { addToWatchlist, removeFromWatchlist, getWatchlist } = require('./Watchlist.js');

// Connect to MongoDB
const MONGO_URI = 'mongodb://localhost:27017/watchlistTestDB'; // Use a test database
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch(err => console.error('Connection error', err));

// Define a sample user ID and product ID for testing
const userId = new mongoose.Types.ObjectId();
const productId = new mongoose.Types.ObjectId();

describe('Watchlist Functionality', () => {
    beforeAll(async () => {
        // Clear the watchlist collection before running the tests
        await mongoose.connection.collections['watchlists'].deleteMany({});
    });

    it('should add product to watchlist', async () => {
        const watchlist = await addToWatchlist(userId, productId);
        expect(watchlist.userId).toEqual(userId);
        expect(watchlist.items.length).toEqual(1);
        expect(watchlist.items[0].productId).toEqual(productId);
    });

    it('should not add duplicate product to watchlist', async () => {
        try {
            await addToWatchlist(userId, productId);
        } catch (error) {
            expect(error.message).toEqual("Product already in watchlist");
        }
    });

    it('should remove product from watchlist', async () => {
        const watchlist = await removeFromWatchlist(userId, productId);
        expect(watchlist.items.length).toEqual(0);
    });

    it('should throw error when removing non-existent product from watchlist', async () => {
        try {
            await removeFromWatchlist(userId, productId);
        } catch (error) {
            expect(error.message).toEqual("Product not found in watchlist");
        }
    });

    it('should get watchlist for a user', async () => {
        await addToWatchlist(userId, productId); // Add a product to watchlist for testing
        const watchlist = await getWatchlist(userId);
        expect(watchlist.userId).toEqual(userId);
        expect(watchlist.items.length).toEqual(1);
        expect(watchlist.items[0].productId).toEqual(productId);
    });

    it('should throw error when getting watchlist for non-existent user', async () => {
        const nonExistentUserId = new mongoose.Types.ObjectId();
        try {
            await getWatchlist(nonExistentUserId);
        } catch (error) {
            expect(error.message).toEqual("Watchlist not found");
        }
    });

    afterAll(async () => {
        // Disconnect from MongoDB after running the tests
        await mongoose.disconnect();
    });
});
