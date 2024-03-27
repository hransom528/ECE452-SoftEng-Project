
// Includes dependencies
const { MongoClient } = require('mongodb');
const { connectDB } = require('../dbConfig.js');
require('dotenv').config()
const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);

// Collection Name
const collectionName = 'products';

// Searches for products based on query and filters
/**
 * @param {string} queryInput - The search query
 */
async function productSearchQuery(queryInput) {
    // Use connect method to connect to the server
    const db = await connectDB();
    const collection = db.collection(collectionName);

    // Define agg JSON
    const agg = [
        {
            $search: {
                index: "textSearch",
                text: {
                    query: queryInput.toString(),
                    path: "name",
                },
            },
        },
        {
            $limit: 10,
        },
        {
            $project: {
                _id: 0,
                name: 1,
            },
        },
    ];
    const cursor = await collection.aggregate(agg);
    var results = [];
    await cursor.forEach((doc) => results.push((doc)));
    await client.close();
    return results;
}

// Testing
/*
async function test() {
    let testQuery = "bar";
    const result = await productSearchQuery(testQuery);
    console.log(result);
    process.exit(0);
}
test();
*/

module.exports = { productSearchQuery };
