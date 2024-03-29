const { connectDB } = require('../dbConfig.js');
require('dotenv').config();

const fetchTopRatedProducts = async () => {
    const db = await connectDB();
    const products = db.collection('products');

    console.log("Fetching top rated products");

    try {
        const topRatedProducts = await products.find({})
            .sort({ rating: -1 })
            .limit(10)
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

const fetchTopRatedProductsByBrand = async (brand) => {
    const db = await connectDB();
    const products = db.collection('products');

    console.log(`Fetching top rated products for brand: ${brand}`);

    try {
        const topRatedProducts = await products.find({ brand })
            .sort({ rating: -1 })
            .limit(5)
            .toArray();

        console.log(`Top 5 rated products fetched successfully for brand: ${brand}`);
        const productIds = topRatedProducts.map(product => product._id.toString());

        console.log(`Top 5 Rated Products by Brand '${brand}' Object IDs:`, productIds);

        return productIds;
    } catch (error) {
        console.error(`An error occurred during fetching top rated products for brand: ${brand}:`, error);
        throw error;
    }
};

const fetchTopRatedProductsByType = async (type) => {
    const db = await connectDB();
    const products = db.collection('products');

    console.log(`Fetching top rated products for type: ${type}`);

    try {
        const topRatedProducts = await products.find({ type })
            .sort({ rating: -1 })
            .limit(5)
            .toArray();

        console.log(`Top 5 rated products fetched successfully for type: ${type}`);
        const productIds = topRatedProducts.map(product => product._id.toString());

        console.log(`Top 5 Rated Products by Type '${type}' Object IDs:`, productIds);

        return productIds;
    } catch (error) {
        console.error(`An error occurred during fetching top rated products for type: ${type}:`, error);
        throw error;
    }
};

module.exports = {
    fetchTopRatedProducts,
    fetchTopRatedProductsByBrand,
    fetchTopRatedProductsByType
};
