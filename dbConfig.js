const { MongoClient } = require('mongodb');

const MONGO_URI = "mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(MONGO_URI);

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

module.exports = { connectDB };
