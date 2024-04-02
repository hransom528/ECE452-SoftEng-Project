require('dotenv').config();

const { MongoClient } = require('mongodb');
const { getWatchlist, removeFromWatchlist, addToWatchlist } = require('../../Watchlist');

const { connectDBandClose } = require('../../../dbConfig');

let db, client;

beforeAll(async () => {
    const connection = await connectDBandClose();
    db = connection.db;
    client = connection.client;
});

beforeEach(async () => {
    // Clear any existing data in the collections before each test
    await db.collection('watchList').deleteMany({});
});

afterAll(async () => {
    // Close the MongoDB connection after all tests have run
    await client.close();
});

describe('Watchlist Module', () => {
    let userId = 'user123';
    let productId = 'product123';

    describe('getWatchlist', () => {
        it('should return an empty array if no watchlist is found for the user', async () => {
            const watchlist = await getWatchlist(userId);
            expect(watchlist).toEqual([]);
        });

        it('should return product details for each product in the watchlist', async () => {
            await db.collection('watchList').insertOne({ userId: userId, products: [productId] });
            await db.collection('products').insertOne({ _id: productId, name: 'Product 123' });

            const watchlist = await getWatchlist(userId);
            expect(watchlist).toEqual([{ _id: productId, name: 'Product 123' }]);
        });
    });

    describe('removeFromWatchlist', () => {
        it('should remove a product from the watchlist', async () => {
            await db.collection('watchList').insertOne({ userId: userId, products: [productId] });

            await removeFromWatchlist(userId, productId);

            const watchlist = await db.collection('watchList').findOne({ userId: userId });
            expect(watchlist.products).not.toContain(productId);
        });
    });

    describe('addToWatchlist', () => {
        it('should add a product to the watchlist', async () => {
            await addToWatchlist(userId, productId);

            const watchlist = await db.collection('watchList').findOne({ userId: userId });
            expect(watchlist.products).toContain(productId);
        });

        it('should not add a product if it does not exist', async () => {
            const nonExistingProductId = 'nonExistingProduct123';
            spyOn(console, 'log');
            await addToWatchlist(userId, nonExistingProductId);

            const watchlist = await db.collection('watchList').findOne({ userId: userId });
            expect(watchlist).toBeNull();
            expect(console.log).toHaveBeenCalledWith('Product not found.');
        });
    });

    // Add additional test cases as needed
});
