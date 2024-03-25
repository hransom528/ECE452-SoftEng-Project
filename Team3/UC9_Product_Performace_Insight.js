const { connectDB } = require('../dbConfig.js');
require('dotenv').config();
const fetchTopRatedProducts = async () => {
    const db = await connectDB();
    const products = db.collection('products');

    console.log("Fetching top rated products");

    try {
        const topRatedProducts = await products.find({})
            .sort({ rating: -1 }) // Sort by rating in descending order
            .limit(10) // Limit to top 10
            .toArray();

        console.log("Top 10 rated products fetched successfully");
        const productIds = topRatedProducts.map(product => product._id.toString());

        console.log('Top 10 Rated Products Object IDs:', productIds);

        return productIds;
    } catch (error) {
        console.error("An error occurred during fetching top rated products:", error);
        throw error;
    }
};

module.exports = { fetchTopRatedProducts };
