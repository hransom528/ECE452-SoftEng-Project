const { ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig'); // Update the path as necessary
const { v4: uuidv4 } = require('uuid'); // Import the UUID package

async function updateListings(productIds, updateFields) {
    if (!productIds || !updateFields) {
        throw new Error('\'productIds\' and \'updateFields\' are required');
    }

    // Generate a UUID for this update operation
    const updateId = uuidv4();
    
    // Include the UUID in the update fields
    updateFields.updateId = updateId;

    const objectIdProductIds = productIds.map(id => new ObjectId(id));
    const db = await connectDB();
    const collection = db.collection('products');

    const filter = { _id: { $in: objectIdProductIds } };
    const update = { $set: updateFields };

    const result = await collection.updateMany(filter, update);
    console.log(`${result.matchedCount} listings matched the filter criteria`);
    console.log(`${result.modifiedCount} listings were updated`);
    
    // Return the result along with the UUID for this operation
    return { result, updateId };
}

module.exports = {
    updateListings
};
