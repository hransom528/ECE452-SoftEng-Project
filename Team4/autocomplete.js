// Includes dependencies
const { MongoClient } = require('mongodb');
const { connectDB } = require('../dbConfig.js');
require('dotenv').config()

// TODO: Change MongoDB URI to secret
require('dotenv').config()
const MONGO_URI = process.env.MONGO_URI;
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

        // TODO: Compound aggregation
        /*
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
        ];*/

        // Run pipeline
        const result = await collection.aggregate(agg);

        // Print results
        var results = [];
        await result.forEach((doc) => results.push((doc)));
        return results;
    } 
    catch (e) {
        console.error(e);
        return false;
    }
    finally {
        await client.close();
    }
}

// Testing
// const results = await autocompleteProductSearch("bar");

module.exports = { autocompleteProductSearch };