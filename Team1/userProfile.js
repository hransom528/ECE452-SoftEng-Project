const { connectDB } = require('../dbConfig');
const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

async function updateUserEmail(userId, newEmail) {
    if (!userId || !newEmail) {
        throw new Error('userId and newEmail are required');
    }

    if (!validateEmail(newEmail)) {
        throw new Error('Invalid email format');
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

    // Ensure that updatedAddress does not contain an addressId field
    // This prevents changing the addressId during an update
    const { addressId: _, ...updateFields } = updatedAddress;

    const db = await connectDB();
    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId), "shippingAddresses.addressId": addressId },
        { $set: { "shippingAddresses.$": { ...updateFields, addressId } } }
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
    updateUserPremiumStatus,
    addUserShippingAddress,
    updateUserShippingAddress,
};