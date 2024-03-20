const { connectDB } = require('./dbConfig'); 

async function testConnection() {
    const db = await connectDB();
    if(db) {
        console.log("Database connection test successful.");
        // Optionally, perform further operations to test the connection
    }
}

testConnection().catch(console.error);