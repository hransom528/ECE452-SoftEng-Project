const { ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig'); // Update the path as necessary


async function addProduct(productDetails) {
    if (!productDetails) {
        throw new Error('\'productDetails\' are required');
    }

    

    const db = await connectDB();
    const collection = db.collection('products');

    const result = await collection.insertOne(productDetails);
    console.log(`A new product was inserted with the _id: ${result.insertedId}`);

    // Return the result along with the productId for this operation
    return { result, productId: productDetails.productId };
}

module.exports = {
    addProduct
};

