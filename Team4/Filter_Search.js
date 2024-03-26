// Includes dependencies
const { connectDB } = require('../dbConfig.js');
require('dotenv').config();

async function productFilterQuery(query) {
    //connect to server
    const db = await connectDB();
    const products = db.collection('products');

    try {
        const filteredProducts = await products.find(query)
            .toArray();

        const productIds = filteredProducts.map(product => product._id.toString());

        //console.log('Filtered Product IDS:', productIds);

        return productIds;
    } catch (error) {
        console.error("An error occurred during fetching filtered products:", error);
        throw error;
    }
};

module.exports=productFilterQuery;



