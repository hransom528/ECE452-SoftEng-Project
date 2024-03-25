const { ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig'); // Ensure this path matches your project structure

async function updateDiscount(_id, discountPercentage) {


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

async function discountByBrand(brand, discountPercentage) {

    const db = await connectDB();
    const collection = db.collection('products');

    // Update all products of the specified brand with the new discount
    const result = await collection.updateMany(
        { brand: brand },
        [
            {
                $set: {
                    discount: discountPercentage,
                    originalPrice: { $ifNull: ["$originalPrice", "$price"] }, // Preserve the original price if it exists
                    price: {
                        $multiply: [
                            { $ifNull: ["$originalPrice", "$price"] }, // Apply discount on originalPrice if it exists
                            (100 - discountPercentage) / 100
                        ]
                    }
                }
            }
        ]
    );

    return {
        message: `Discount updated for all products of brand ${brand}.`,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
    };
}

async function discountByType(type, discountPercentage) {

    const db = await connectDB();
    const collection = db.collection('products');

    // Update all products of the specified type with the new discount
    const result = await collection.updateMany(
        { type: type },
        [
            {
                $set: {
                    discount: discountPercentage,
                    originalPrice: { $ifNull: ["$originalPrice", "$price"] }, // Preserve the original price if it exists
                    price: {
                        $multiply: [
                            { $ifNull: ["$originalPrice", "$price"] }, // Apply discount on originalPrice if it exists
                            (100 - discountPercentage) / 100
                        ]
                    }
                }
            }
        ]
    );

    return {
        message: `Discount updated for all products of type ${type}.`,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
    };
}


module.exports = {
    updateDiscount,
    discountByBrand,
    discountByType
};

