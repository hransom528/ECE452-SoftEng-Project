const { MongoClient } = require('mongodb');
//const assert = require('assert');

// MongoDB URI
const MONGO_URI = 'mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
// Database Name
const dbName = 'website';

// Collection Name
const salesCollectionName = 'sales_data'; //  sales data collection
const ratingsCollectionName = 'customer_ratings'; // customer ratings collection

// Function to fetch and analyze product performance insights
async function fetchProductPerformanceInsights() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(dbName);

        // Fetch sales data
        const salesCollection = db.collection(salesCollectionName);
        const salesData = await salesCollection.find({}).toArray(); // Fetches all sales data
        console.log('Sales Data:', salesData);

        // Calculate total sales and average sales per product
        let totalSales = 0;
        let productCount = 0;
        salesData.forEach(sale => {
            totalSales += sale.amount; //  'amount' represents the sales figure
            productCount++;
        });
        const averageSales = totalSales / productCount;
        console.log('Total Sales:', totalSales, 'Average Sales per Product:', averageSales);

        // Fetch customer ratings
        const ratingsCollection = db.collection(ratingsCollectionName);
        const ratingsData = await ratingsCollection.find({}).toArray(); // Fetches all ratings data
        console.log('Ratings Data:', ratingsData);

        // Calculate average rating
        let totalRating = 0;
        ratingsData.forEach(rating => {
            totalRating += rating.score; //  'score' represents the rating
        });
        const averageRating = totalRating / ratingsData.length;
        console.log('Average Rating:', averageRating);

    } catch (err) {
        console.error('Error fetching product performance insights:', err);
    } finally {
        // Close the client
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

// Call the function to fetch product performance insights
fetchProductPerformanceInsights();

