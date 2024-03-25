const { ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig.js');

const updateListings = async (productIds, updateFields, removeFields = []) => {
    const db = await connectDB();
    const products = db.collection('products');

    console.log("Updating productIds:", productIds);
    console.log("With updateFields:", updateFields);
    console.log("Removing fields:", removeFields);

    try {
        const updates = productIds.map(id => {
            if (!ObjectId.isValid(id)) {
                throw new Error(`Invalid ObjectId: ${id}`);
            }
            let updateOperation = {};
            if (Object.keys(updateFields).length > 0) {
                updateOperation.$set = updateFields;
            }
            if (removeFields.length > 0) {
                updateOperation.$unset = removeFields.reduce((acc, field) => {
                    acc[field] = "";
                    return acc;
                }, {});
            }
            const updatePromise = products.updateOne(
                { _id: new ObjectId(id) },
                updateOperation
            );

            updatePromise.catch(err => {
                console.error(`Error updating document with _id ${id}:`, err);
            });

            return updatePromise;
        });

        const results = await Promise.allSettled(updates);
        const failedUpdates = results.filter(result => result.status === 'rejected');
        if (failedUpdates.length > 0) {
            console.error("Some updates failed:", failedUpdates);
        }

        const successfulUpdates = results.filter(result => result.status === 'fulfilled');
        return successfulUpdates.map(result => result.value);
    } catch (error) {
        console.error("An error occurred during the update operation:", error);
        throw error;
    }
};
const deleteListings = async (productIds) => {
    const db = await connectDB();
    const products = db.collection('products');

    console.log("Deleting productIds:", productIds);

    try {
        const deletions = productIds.map(id => {
            if (!ObjectId.isValid(id)) {
                throw new Error(`Invalid ObjectId: ${id}`);
            }
            const deletePromise = products.deleteOne({ _id: new ObjectId(id) });

            deletePromise.catch(err => {
                console.error(`Error deleting document with _id ${id}:`, err);
            });

            return deletePromise;
        });

        const results = await Promise.allSettled(deletions);
        const failedDeletions = results.filter(result => result.status === 'rejected');
        if (failedDeletions.length > 0) {
            console.error("Some deletions failed:", failedDeletions);
        }

        const successfulDeletions = results.filter(result => result.status === 'fulfilled');
        return successfulDeletions.map(result => result.value);
    } catch (error) {
        console.error("An error occurred during the deletion operation:", error);
        throw error;
    }
};


module.exports = { updateListings,deleteListings };
