
// Includes dependencies
const { MongoClient } = require('mongodb');
const assert = require("assert");

// TODO: Change MongoDB URI to secret
const MONGO_URI = "mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const client = new MongoClient(MONGO_URI);

// Database Name
const dbName = 'website';

// Searches for products based on query and filters
// TODO: Implement filters
/**
 * @param {MongoClient} client
 * @param {string} query
 */
async function productSearchQuery(query) {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('products');

    // TODO Define agg JSON
    const agg = [
        {
            $search: {
                text: {
                    query: query,
                    path: {
                        wildcard: "*"
                    }
                }
            }
        }
    ];
    const cursor = await collection.aggregate(agg);
    await cursor.forEach((doc) => console.log(doc));
    await client.close();
    return true;
}

const testQuery = "barbell";
productSearchQuery(testQuery)
    //.then(console.log)
    //.catch(console.error)
    //.finally(() => client.close());