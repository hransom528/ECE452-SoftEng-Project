// UC8update_listings.js
const { ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig.js'); // Update the path as necessary

async function updateListings(productIds, updateFields) {
    if (!productIds || !updateFields) {
        throw new Error('\'productIds\' and \'updateFields\' are required');
    }

    const objectIdProductIds = productIds.map(id => new ObjectId(id));
    const db = await connectDB();
    const collection = db.collection('products');

    const filter = { _id: { $in: objectIdProductIds } };
    const update = { $set: updateFields };

    const result = await collection.updateMany(filter, update);
    console.log(`${result.matchedCount} listings matched the filter criteria`);
    console.log(`${result.modifiedCount} listings were updated`);

    return result;
}

module.exports = {
    updateListings
};
