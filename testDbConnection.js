const { connectDB } = require('./dbConfig'); 

async function testConnection() {
    try {
        const db = await connectDB();
        console.log("Database connection test successful.", db);
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error.message);
    }
}

testConnection().catch(console.error);