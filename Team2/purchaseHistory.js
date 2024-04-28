// purchaseHistory.js
const { connectDBandClose } = require('../dbConfig');
const { ObjectId } = require('mongodb');

// Function to retrieve purchase history for a user by user ID with item names
async function getPurchaseHistoryByUserId(userId) {
    let client;
    try {
        const { db, client: dbClient } = await connectDBandClose();
        client = dbClient;
        const collection = db.collection('purchases');

        const purchaseHistory = await collection.aggregate([
            {
                $match: { userId: new ObjectId(userId) }
            },
            {
                $unwind: '$items' // Unwind the items array
            },
            {
                $lookup: {
                    from: 'products', // Collection to join
                    localField: 'items.productId', // Field from the input documents
                    foreignField: '_id', // Field from the documents of the "from" collection
                    as: 'productDetails' // Output array field
                }
            },
            {
                $unwind: '$productDetails' // Unwind the productDetails array
            },
            {
                $addFields: {
                    'items.productName': '$productDetails.name', // Add the product name to the items
                    'items.productBrand': '$productDetails.brand', // Add the product brand to the items
                    // Add any other product details you need here
                }
            },
            {
                $group: {
                    _id: '$_id', // Group back by the original purchase document _id
                    userId: { $first: '$userId' },
                    total: { $first: '$total' },
                    shippingAddr: { $first: '$shippingAddr' },
                    billingAddr: { $first: '$billingAddr' },
                    paymentDetails: { $first: '$paymentDetails' },
                    items: { $push: '$items' }, // Collect the items back into an array
                    OrderStatus: {$first: '$OrderStatus'}
                }
            }
        ]).toArray();

        if (purchaseHistory.length === 0) {
            return { success: false, message: 'No purchase history found for the given user ID.' };
        }

        return { success: true, data: purchaseHistory };
    } catch (error) {
        console.error('Error retrieving purchase history with item names:', error);
        return { success: false, message: error.message };
    } finally {
        if (client) {
            await client.close();
        }
    }
}

module.exports = { getPurchaseHistoryByUserId };
