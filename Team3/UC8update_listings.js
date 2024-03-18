const { MongoClient } = require('mongodb');
const assert = require('assert');

// MongoDB URI
const MONGO_URI = 'mongodb+srv://your_username:your_password@your_cluster_url/your_database_name?retryWrites=true&w=majority';

// Database Name
const dbName = 'your_database_name';

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
//Replace your_username, your_password, your_cluster_url, your_database_name, your_collection_name, and your_product_id with your actual MongoDB credentials, database details, and product ID for the listing you want to update. You can modify the update object to include the fields you want to update for the listing.
