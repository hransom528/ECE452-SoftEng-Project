const { ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig'); // Ensure this path matches your project structure

async function updateDiscount(_id, discountPercentage) {
    if (!_id || discountPercentage == null) {
        throw new Error('\'_id\' and \'discountPercentage\' are required');
    }

    const db = await connectDB();
    const collection = db.collection('products');

    // Retrieve the current product to calculate the new price
    const product = await collection.findOne({ _id: new ObjectId(_id) });
    if (!product) {
        throw new Error('Product not found');
    }

    // Calculate the new price
    const originalPrice = product.originalPrice || product.price; // Use originalPrice if available
    const newPrice = originalPrice * ((100 - discountPercentage) / 100);

    // Update the product with the new price and set/update the discount and originalPrice fields
    const result = await collection.updateOne(
        { _id: new ObjectId(_id) },
        {
            $set: {
                price: newPrice,
                discount: discountPercentage,
                originalPrice: originalPrice
            }
        }
    );

    console.log(`${result.matchedCount} product(s) matched the filter.`);
    console.log(`${result.modifiedCount} product(s) were updated.`);

    return {
        message: `Discount updated for product ID ${_id}. New price is ${newPrice}.`,
        _id: _id,
        newPrice: newPrice,
        discount: discountPercentage
    };
}

module.exports = {
    updateDiscount
};

