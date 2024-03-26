// Includes dependencies
const { MongoClient } = require('mongodb');
const { connectDB } = require('../dbConfig.js');

// TODO: Change MongoDB URI to secret
const MONGO_URI = "mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const client = new MongoClient(MONGO_URI);

// Product collection name
const collectionName = 'products';

// Autocompletes product search based on query
/**
 * @param {string} queryInput
 */
async function autocompleteProductSearch(queryInput) {
    try {
        // Use connect method to connect to the server
        const db = await connectDB();
        const collection = db.collection(collectionName);

        // Define pipeline
        const agg = [
            {$search: {index: "autocomplete-product", autocomplete: {query: queryInput.toString(), path: "name"}}},
            {$limit: 10},
            {$project: {_id: 0, name: 1}}
        ];

        const compoundAgg = [
            {
                '$search': {
                    'index': 'autocomplete-tutorial',
                    'compound': {
                        'should': [
                            {
                                'autocomplete': {
                                    'query': queryInput.toString(),
                                    'path': 'name'
                                }
                            },
                            {
                                'autocomplete': {
                                    'query': queryInput.toString(),
                                    'path': 'brand'
                                }
                            }
                        ],
                        'minimumShouldMatch': 1
                    }
                }
            },
            {
                '$limit': 5
            },
            {
                '$project': {
                    '_id': 0,
                    'name': 1,
                    'brand': 1
                }
            }
        ];

        // Run pipeline
        const result = await collection.aggregate(agg);

        // Print results
        await result.forEach((doc) => console.log(doc));
    } 
    finally {
        await client.close();
    }
    return true;
}

// Testing
// autocompleteProductSearch("bar");

module.exports = { autocompleteProductSearch };