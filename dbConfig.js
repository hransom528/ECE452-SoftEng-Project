require('dotenv').config();

const { MongoClient } = require('mongodb');
const mongoURI = process.env.MONGO_URI;
const client = new MongoClient(mongoURI);

async function connectDB() {
    try {
        await client.connect();
        console.log("Connected successfully to MongoDB");
        const db = client.db('website');
        return { db, client };  // Return both db and client
    } catch (error) {
        console.error("Could not connect to MongoDB", error);
        process.exit(1);
    }
}

module.exports = { connectDB };