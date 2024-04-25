const { ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig.js');

const updateListings = async (productIds, updateFields, removeFields = []) => {
    const db = await connectDB();
    const products = db.collection('products');
    const validProductIds = productIds.filter(id => ObjectId.isValid(id));
    const invalidProductIds = productIds.filter(id => !ObjectId.isValid(id));
    if (invalidProductIds.length > 0) {
        console.error("Invalid ObjectId(s) detected:", invalidProductIds);
    }

    console.log("Updating productIds:", validProductIds);
    console.log("With updateFields:", updateFields);
    console.log("Removing fields:", removeFields);

    try {
        const updates = validProductIds.map(id => {
            let updateOperation = { $set: updateFields };
            if (removeFields.length > 0) {
                updateOperation.$unset = removeFields.reduce((acc, field) => {
                    acc[field] = "";
                    return acc;
                }, {});
            }
            return products.updateOne({ _id: new ObjectId(id) }, updateOperation);
        });

        const results = await Promise.allSettled(updates);
        return results.map(result => {
            if (result.status === 'rejected') {
                console.error("Update failed for a document:", result.reason);
                return { success: false, error: result.reason };
            }
            return { success: true, data: result.value };
        });
    } catch (error) {
        console.error("An error occurred during the update operation:", error);
        throw error;
    }
};

const deleteListings = async (productIds) => {
    const db = await connectDB();
    const products = db.collection('products');

    // Validate ObjectIds first
    const validProductIds = productIds.filter(id => ObjectId.isValid(id));
    const invalidProductIds = productIds.filter(id => !ObjectId.isValid(id));
    if (invalidProductIds.length > 0) {
        console.error("Invalid ObjectId(s) detected:", invalidProductIds);
        // Decide on how to handle invalid IDs
    }

    console.log("Deleting productIds:", validProductIds);

    try {
        const deletions = validProductIds.map(id => {
            return products.deleteOne({ _id: new ObjectId(id) });
        });

        const results = await Promise.allSettled(deletions);
        return results.map(result => {
            if (result.status === 'rejected') {
                console.error("Deletion failed for a document:", result.reason);
                return { success: false, error: result.reason };
            }
            return { success: true, data: result.value };
        });
    } catch (error) {
        console.error("An error occurred during the deletion operation:", error);
        throw error;
    }
};

module.exports = { updateListings, deleteListings };
