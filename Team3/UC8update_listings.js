const { MongoClient } = require('mongodb');
const assert = require('assert');

// MongoDB URI
const MONGO_URI = 'mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
// Database Name
const dbName = 'website';

// Collection Name
const collectionName = 'your_collection_name';

// Function to update listings
async function updateListings() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Example update operation
        const filter = { productId: 'your_product_id' };
        const update = {
            $set: {
                name: 'Updated Product Name',
                description: 'Updated Product Description',
                price: 99.99,
                stockQuantity: 100
            }
        };

        const result = await collection.updateOne(filter, update);
        assert.equal(1, result.matchedCount);
        assert.equal(1, result.modifiedCount);

        console.log('Listing updated successfully');
    } catch (err) {
        console.error('Error updating listing:', err);
    } finally {
        // Close the client
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

// Call the updateListings function
updateListings();
// new coment 