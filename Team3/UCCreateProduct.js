const { ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig'); // Update the path as necessary


async function addProduct(productDetails) {
    if (!productDetails) {
        throw new Error('\'productDetails\' are required');
    }


    // Validate product name as a string
    if (typeof productDetails.name !== 'string') {
        throw new Error('Product name must be a string');
    }

    if (typeof productDetails.type !== 'string') {
        throw new Error('Product type must be a string');
    }

// Validate specifications
// if (productDetails.specs) {
//     // Validate weight ends with 'lbs' or 'kg'
//     if (productDetails.specs.weight) {
//         const weightUnit = productDetails.specs.weight.slice(-3);
//         if (weightUnit !== 'lbs' && weightUnit !== 'kg') {
//             throw new Error('Weight must end with \'lbs\' or \'kg\'');
//         }
//     }

if (productDetails.specs) {
    // Validate weight ends with 'lbs' or 'kg'
    if (productDetails.specs.weight) {
        const weightRegex = /^\d+(\.\d+)?\s*(lbs|kg)$/;
        if (!weightRegex.test(productDetails.specs.weight)) {
            throw new Error('Weight must be a number followed by "lbs" or "kg"');
        }
    }

    // Validate length ends with 'cm' or 'ft'
    if (productDetails.specs.length) {
        const lengthUnit = productDetails.specs.length.slice(-2);
        if (lengthUnit !== 'cm' && lengthUnit !== 'ft') {
            throw new Error('Length must end with \'cm\' or \'ft\'');
        }
    }

    // Continue with other specs validations
}

    // Validate price as a positive number
    if (typeof productDetails.price !== 'number' || productDetails.price <= 0) {
        throw new Error('Price must be a positive number');
    }

    // Validate stockQuantity as a positive integer
    if (!Number.isInteger(productDetails.stockQuantity) || productDetails.stockQuantity < 0) {
        throw new Error('Stock quantity must be a positive whole number');
    }

 // Validate performance features
 if (typeof productDetails.trendingScore !== 'undefined') {
    if (typeof productDetails.trendingScore !== 'number' || productDetails.trendingScore < 0 || productDetails.trendingScore > 10) {
        throw new Error('Trending score must be a number between 0 and 10');
    }
}

if (typeof productDetails.topTrending !== 'boolean') {
    throw new Error('Top trending must be a boolean');
}

if (typeof productDetails.rating !== 'undefined') {
    if (typeof productDetails.rating !== 'number' || productDetails.rating < 0 || productDetails.rating > 5) {
        throw new Error('Rating must be a number between 0 and 5');
    }
}


    const db = await connectDB();
    const collection = db.collection('products');

        // Check if a product with the same name already exists
        const existingProduct = await collection.findOne({ name: productDetails.name });
        if (existingProduct) {
            throw new Error(`Product with name ${productDetails.name} already exists. Consider updating quantity for product with _id: ${existingProduct._id}`);
        }

    const result = await collection.insertOne(productDetails);
    console.log(`A new product was inserted with the _id: ${result.insertedId}`);

    // Return the result along with the productId for this operation
    return { result, productId: productDetails.productId };
}

module.exports = {
    addProduct
};

