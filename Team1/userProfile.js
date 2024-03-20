const { connectDB } = require('../dbConfig');

async function updateUserEmail(userId, newEmail) {
    if (!userId || !newEmail) {
        throw new Error('userId and newEmail are required');
    }
    
    const db = await connectDB();
    const collection = db.collection('users');
    
    const result = await collection.updateOne(
        { _id: userId }, 
        { $set: { email: newEmail } }
    );
    
    if (result.matchedCount === 0) {
        throw new Error(`No user found with ID ${userId}`);
    }
    
    console.log(`Successfully updated the email for user ID ${userId}`);
    return result;
}

async function updateUserName(userId, newName) {
    const db = await connectDB();
    const result = await db.collection('users').updateOne({ _id: userId }, { $set: { name: newName } });
    console.log(result);
    return result;
}

async function updateUserPhoneNumber(userId, newPhoneNumber) {
    const db = await connectDB();
    const result = await db.collection('users').updateOne({ _id: userId }, { $set: { phoneNumber: newPhoneNumber } });
    console.log(result);
    return result;
}

async function updateUserPremiumStatus(userId, isPremium) {
    const db = await connectDB();
    const result = await db.collection('users').updateOne({ _id: userId }, { $set: { isPremium: isPremium } });
    console.log(result);
    return result;
}

async function addUserShippingAddress(userId, newAddress) {
    const db = await connectDB();
    const result = await db.collection('users').updateOne({ _id: userId }, { $push: { shippingAddresses: newAddress } });
    console.log(result);
    return result;
}

async function updateUserShippingAddress(userId, addressId, updatedAddress) {
    const db = await connectDB();
    const result = await db.collection('users').updateOne(
        { _id: userId, "shippingAddresses.addressId": addressId },
        { $set: { "shippingAddresses.$": updatedAddress } }
    );
    console.log(result);
    return result;
}

module.exports = {
    updateUserEmail,
    updateUserName,
    updateUserPhoneNumber,
    updateUserPremiumStatus,
    addUserShippingAddress,
    updateUserShippingAddress,
};