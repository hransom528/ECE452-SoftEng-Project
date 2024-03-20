const { MongoClient } = require('mongodb');
const assert = require('assert');

// MongoDB URI
const MONGO_URI = 'mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
// Database Name
const dbName = 'website';

// Collection Name
const collectionName = 'products';

// Function to update listings
async function updateListings(productIdsToUpdate, updateFields) {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Example update operation for multiple products by ID
        const filter = { productId: { $in: productIdsToUpdate } };
        const update = {
            $set: updateFields
        };

        const result = await collection.updateMany(filter, update);
        console.log(`${result.matchedCount} listings matched the filter criteria`);
        console.log(`${result.modifiedCount} listings were updated`);

        console.log('Listings updated successfully');
    } catch (err) {
        console.error('Error updating listings:', err);
    } finally {
        // Close the client
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

// Example usage
const productIdsToUpdate = ['product_id_1', 'product_id_2', 'product_id_3'];
const updateFields = {
    name: 'Updated Product Name',
    description: 'Updated Product Description',
    price: 99.99,
    stockQuantity: 100
};

updateListings(productIdsToUpdate, updateFields);
