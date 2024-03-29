const { connectDB } = require('../dbConfig');
const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const { getUserInfo } = require('./Reg_lgn/oAuthHandler');

async function validateAccessTokenAndGetUserInfo(accToken) {
    if (!accToken) {
        throw new Error("Access Token is required for authorization.");
    }

    try {
        const userInfo = await getUserInfo(accToken);
        return userInfo; // Return the user info if the token is valid
    } catch (error) {
        console.error("Error during access token validation:", error);
        throw new Error("Failed to authorize with provided Access Token.");
    }
}

function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

async function updateUserProfile(requestBody) {
    const { userId, profileUpdates, accToken } = requestBody;
    
    // Validate the access token and get user info
    const userInfo = await validateAccessTokenAndGetUserInfo(accToken);
    
    if (!userId || !profileUpdates) {
        throw new Error('userId and profileUpdates are required');
    }

    const db = await connectDB();
    const collection = db.collection('users');
    const userObjectId = new ObjectId(userId);

    // Fetch the current user profile
    const currentUser = await collection.findOne({ _id: userObjectId });
    if (!currentUser) {
        throw new Error(`No user found with ID ${userId}`);
    }

    // Prepare update operations based on profileUpdates object
    const updateOperations = {};
    for (const [key, value] of Object.entries(profileUpdates)) {
        // Skip fields that haven't changed
        if (currentUser[key] === value) continue;

        // Special handling for email to validate it
        if (key === 'email' && !validateEmail(value)) {
            throw new Error('Invalid email format');
        }

        // Special handling for adding new shipping address
        if (key === 'shippingAddresses' && Array.isArray(value)) {
            for (const address of value) {
                address.addressId = uuidv4(); // Ensure each new address has a unique ID
            }
            updateOperations.$push = { shippingAddresses: { $each: value } };
            continue;
        }

        // Add the update to the update operations
        updateOperations.$set = updateOperations.$set || {};
        updateOperations.$set[key] = value;
    }

    // Perform the update if there are changes to be made
    if (Object.keys(updateOperations).length > 0) {
        const result = await collection.updateOne(
            { _id: userObjectId },
            updateOperations,
            { upsert: false } // You may not want to create a new document if one doesn't exist
        );

        if (result.matchedCount === 0) {
            throw new Error(`No updates performed for user with ID ${userId}`);
        }

        console.log(`Successfully updated profile for user ID ${userId}`);
        return result;
    } else {
        // No changes detected, so no database operation is necessary.
        console.log(`No updates necessary for user ID ${userId}`);
        return { message: 'No updates necessary' };
    }
}

async function updateUserName(requestBody) {
    const { userId, newName, accToken } = requestBody;
    
    // Validate the access token and get user info
    const userInfo = await validateAccessTokenAndGetUserInfo(accToken);

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

async function updateUserPremiumStatus(requestBody) {
    const { userId, isPremium, accToken } = requestBody;
    
    // Validate the access token and get user info
    const userInfo = await validateAccessTokenAndGetUserInfo(accToken);

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

async function addUserShippingAddress(requestBody) {
    const { userId, newAddress, accToken } = requestBody;
    
    // Validate the access token and get user info
    const userInfo = await validateAccessTokenAndGetUserInfo(accToken);

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

async function updateUserShippingAddress(requestBody) {
    const { userId, addressId, updatedAddress, accToken } = requestBody;
    
    // Validate the access token and get user info
    const userInfo = await validateAccessTokenAndGetUserInfo(accToken);

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

async function deleteUserShippingAddress(requestBody) {
    const { userId, addressId, accToken } = requestBody;
    
    // Validate the access token and get user info
    const userInfo = await validateAccessTokenAndGetUserInfo(accToken);

    if (!userId || !addressId) {
        throw new Error('userId and addressId are required');
    }

    const db = await connectDB();

    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { shippingAddresses: { addressId: addressId } } }
    );

    if (result.matchedCount === 0) {
        throw new Error(`No user found with ID ${userId} or addressId ${addressId}`);
    }

    console.log(`Successfully deleted shipping address ${addressId} for user ID ${userId}`);
    return result;
}

async function deleteUserProfile(requestBody) {
    const { userId, accToken } = requestBody;
    
    // Validate the access token and get user info
    const userInfo = await validateAccessTokenAndGetUserInfo(accToken);

    if (!userId) {
        throw new Error('userId is required');
    }

    const db = await connectDB();

    const result = await db.collection('users').deleteOne(
        { _id: new ObjectId(userId) }
    );

    if (result.deletedCount === 0) {
        throw new Error(`No user found with ID ${userId}`);
    }

    console.log(`Successfully deleted user profile for user ID ${userId}`);
    return result;
}


module.exports = {
    updateUserProfile,
    updateUserName,
    updateUserPremiumStatus,
    addUserShippingAddress,
    updateUserShippingAddress,
    deleteUserShippingAddress,
    deleteUserProfile
};