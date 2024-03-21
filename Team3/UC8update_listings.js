const { MongoClient } = require('mongodb');
const { connectDB } = require('../dbConfig');

async function updateListings(productIds, updateFields) {
    if (!productIds || !updateFields) {
        throw new Error('\'productIds\' and \'updateFields\' are required');
    }

    const db = await connectDB();
    const collection = db.collection('products');

    const filter = { productId: { $in: productIds } };
    const update = {
        $set: updateFields
    };

    const result = await collection.updateMany(filter, update);
    console.log(`${result.matchedCount} listings matched the filter criteria`);
    console.log(`${result.modifiedCount} listings were updated`);

    console.log('Listings updated successfully');
    return result;
}

module.exports = {
     updateListings
};
