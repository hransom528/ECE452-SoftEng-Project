const { connectDB } = require('../dbConfig');
const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

async function updateUserEmail(userId, newEmail) {
    if (!userId || !newEmail) {
        throw new Error('userId and newEmail are required');
    }
    
    const db = await connectDB();
    const collection = db.collection('users');
    
    const result = await collection.updateOne(
        { _id: new ObjectId(userId) }, // Will be inputting a hexademical string; deprecation does not apply
        { $set: { email: newEmail } }
    );
    
    if (result.matchedCount === 0) {
        throw new Error(`No user found with ID ${userId}`);
    }
    
    console.log(`Successfully updated the email for user ID ${userId}`);
    return result;
}

async function updateUserName(userId, newName) {
    if (!userId || !newName) {
        throw new Error('userId and newName are required');
    }

    const db = await connectDB();
    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { name: newName } }
    );

    if (result.matchedCount === 0) {
        throw new Error(`No user found with ID ${userId}`);
    }

    console.log(`Successfully updated the name for user ID ${userId}`);
    return result;
}

async function updateUserPhoneNumber(userId, newPhoneNumber) {
    if (!userId || !newPhoneNumber) {
        throw new Error('userId and newPhoneNumber are required');
    }

    const db = await connectDB();
    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { phoneNumber: newPhoneNumber } }
    );

    if (result.matchedCount === 0) {
        throw new Error(`No user found with ID ${userId}`);
    }

    console.log(`Successfully updated the phone number for user ID ${userId}`);
    return result;
}

async function updateUserPremiumStatus(userId, isPremium) {
    if (!userId || isPremium === undefined) {
        throw new Error('userId and isPremium status are required');
    }

    const db = await connectDB();
    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { isPremium: isPremium } }
    );

    if (result.matchedCount === 0) {
        throw new Error(`No user found with ID ${userId}`);
    }

    console.log(`Successfully updated the premium status for user ID ${userId}`);
    return result;
}

async function addUserShippingAddress(userId, newAddress) {
    if (!userId || !newAddress) {
        throw new Error('userId and newAddress are required');
    }

    // Assign a UUID to the new address for the unique addressId
    newAddress.addressId = uuidv4();

    const db = await connectDB();
    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $push: { shippingAddresses: newAddress } }
    );

    if (result.matchedCount === 0) {
        throw new Error(`No user found with ID ${userId}`);
    }
    
    console.log(`Successfully added a new shipping address for user ID ${userId}`);
    return result;
}

async function updateUserShippingAddress(userId, addressId, updatedAddress) {
    if (!userId || !addressId || !updatedAddress) {
        throw new Error('userId, addressId, and updatedAddress are required');
    }

    const db = await connectDB();
    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId), "shippingAddresses.addressId": addressId },
        { $set: { "shippingAddresses.$": updatedAddress } }
    );

    if (result.matchedCount === 0) {
        throw new Error(`No user found with ID ${userId} or addressId ${addressId}`);
    }

    console.log(`Successfully updated a shipping address for user ID ${userId}`);
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