const { ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig.js');  

const updateListings = async (productIds, updateFields) => {
    const db = await connectDB();
    const products = db.collection('products');

    try {
        const updates = productIds.map(id => {
            return products.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });
        });

        const results = await Promise.all(updates);
        return results;
    } catch (error) {
        console.error("An error occurred during the update operation:", error);
        throw error;
    }
};

module.exports = { updateListings };
