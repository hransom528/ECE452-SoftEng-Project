const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../../Watchlist');

describe('Watchlist', () => {
    let mockDB;

    beforeEach(() => {
        mockDB = {
            products: [],
            watchList: {}
        };
    });

    it('should add product to watchlist', async () => {
        const userId = 'user123';
        const productId = 'product123';

        await addToWatchlist(userId, productId);

        expect(mockDB.watchList[userId]).toBeDefined();
        expect(mockDB.watchList[userId].products).toContain(productId);
    });

    it('should remove product from watchlist', async () => {
        const userId = 'user123';
        const productId = 'product123';

        // Add product to watchlist first
        mockDB.watchList[userId] = { products: [productId] };

        await removeFromWatchlist(userId, productId);

        expect(mockDB.watchList[userId]).toBeDefined();
        expect(mockDB.watchList[userId].products).not.toContain(productId);
    });

    it('should retrieve user watchlist', async () => {
        const userId = 'user123';
        const productId = 'product123';

        // Add product to watchlist first
        mockDB.watchList[userId] = { products: [productId] };

        const watchlist = await getWatchlist(userId);

        expect(watchlist.length).toBe(1);
        expect(watchlist[0]._id).toBe(productId); // Adjust this based on the actual structure of product object
    });
});
