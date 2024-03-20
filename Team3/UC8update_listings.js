const { MongoClient } = require('mongodb');
const assert = require('assert');

const MONGO_URI = 'mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'website';
const collectionName = 'products';
const { connectDB } = require('../dbConfig');

async function updateProductsById(productIds, updateFields) {
    if (!productIds || !updateFields) {
        throw new Error('productIds and updateFields are required');
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
    updateProductsById
};
