require('dotenv').config();
const { MongoClient } = require('mongodb');
const mongoURI = process.env.MONGO_URI;
const client = new MongoClient(mongoURI);

async function connectDB() {
    try {
        await client.connect();
        console.log("Connected successfully to MongoDB");
        return client.db('website');
    } catch (error) {
        console.error("Could not connect to MongoDB", error);
        process.exit(1);
    }
}
async function connectDBandClose() {
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

async function openDBConnection() {
    const client = new MongoClient(process.env.MONGO_URI);
    try {
        await client.connect();
        console.log("Connected successfully to MongoDB");
        const db = client.db('website');
        return { db, client };  // Return both db and client
    } catch (error) {
        console.error("Could not connect to MongoDB", error);
        await client.close();
        throw error;
    }
}

module.exports = { connectDB, connectDBandClose, openDBConnection };