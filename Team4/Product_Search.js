
// Includes dependencies
const { MongoClient } = require('mongodb');
const assert = require("assert");


// TODO: Change MongoDB URI to secret
const MONGO_URI = "mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const client = new MongoClient(MONGO_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// Database Name
const dbName = 'website';

// Searches for products based on query and filters
// TODO: Implement filters
/**
 * @param {MongoClient} client
 * @param {string} query
 */
async function searchQuery(client, query) {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('documents');

    return true;
}



const testQuery = "barbell";
searchQuery(testQuery)
    .then(console.log)
    .catch(console.error)
    .finally(() => client.close());


