const { connectDB } = require('../dbConfig');
const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const { getUserInfo } = require('./Reg_lgn/oAuthHandler');
const { verifyAddress } = require('../Team2/AddressValidationAPI');

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
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

async function updateUserProfile(requestBody) {
    const { userId, profileUpdates } = requestBody;
    
    if (!userId || !profileUpdates) {
        throw new Error('userId and profileUpdates are required');
    }
    
    // Validate that userId is a valid MongoDB ObjectId
    if (!ObjectId.isValid(userId)) {
        throw new Error('Invalid userId format');
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
    const { userId, newName } = requestBody;
    
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
    const { userId, isPremium } = requestBody;
    
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
    const { userId, newAddress } = requestBody;
    
    if (!userId || !newAddress) {
        throw new Error('userId and newAddress are required');
    }

    // Validate the new address with Google Maps API
    const validatedAddress = await verifyAddress({address: newAddress});
    if (!validatedAddress.isValid) {
        throw new Error('Invalid address');
    }

    // Assign a UUID to the new, validated address for the unique addressId
    validatedAddress.addressId = uuidv4();

    const db = await connectDB();
    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $push: { shippingAddresses: validatedAddress } }
    );

    if (result.matchedCount === 0) {
        throw new Error(`No user found with ID ${userId}`);
    }
    
    console.log(`Successfully added a new shipping address for user ID ${userId}`);
    return { ...result, addressId: validatedAddress.addressId }; // Include the addressId
}

async function updateUserShippingAddress(requestBody) {
    const { userId, addressId, updatedAddress } = requestBody;

    if (!userId || !addressId || !updatedAddress) {
        throw new Error('userId, addressId, and updatedAddress are required');
    }

    if (!ObjectId.isValid(userId)) {
        throw new Error('Invalid userId format');
    }

    const db = await connectDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) {
        throw new Error(`No user found with ID ${userId}`);
    }

    console.log("User found:", user);

    // Validate the updated address
    const validatedAddress = await verifyAddress(updatedAddress);
    if (!validatedAddress.isValid) {
        console.log('Failed address validation:', validatedAddress.message);
        throw new Error(validatedAddress.message);
    }

    // Find the specific address and update it if it exists
    const addressIndex = user.shippingAddresses.findIndex(addr => addr.addressId === addressId);
    if (addressIndex === -1) {
        throw new Error(`No shipping address found with ID ${addressId}`);
    }

    // Update the specific address
    user.shippingAddresses[addressIndex] = { ...user.shippingAddresses[addressIndex], ...updatedAddress, addressId: addressId };

    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { shippingAddresses: user.shippingAddresses } }
    );

    if (result.modifiedCount === 0) {
        throw new Error(`Failed to update shipping address with ID ${addressId}`);
    }

    console.log(`Successfully updated shipping address for user ID ${userId}`, result);
    return result;
}

async function deleteUserShippingAddress(requestBody) {
    const { userId, addressId } = requestBody;
    
    if (!userId || !addressId) {
        throw new Error('userId and addressId are required');
    }

    const db = await connectDB();

    // Validate the format of the userId and addressId
    if (!ObjectId.isValid(userId)) {
        throw new Error('Invalid userId format');
    }

    // Find the user with the given userId
    const user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) }
    );

    if (!user) {
        throw new Error(`No user found with ID ${userId}`);
    }

    console.log("User found:", user);

    // Check if the shipping address with the specified addressId exists for the user
    const addressExists = user.shippingAddresses && user.shippingAddresses.some(address => address.addressId === addressId);

    if (!addressExists) {
        throw new Error(`No shipping address found with ID ${addressId} for user ID ${userId}`);
    }

    // Proceed with deletion of the address
    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { shippingAddresses: { addressId: addressId } } }
    );

    console.log("Deletion result:", result);

    if (result.modifiedCount === 0) {
        throw new Error(`Failed to delete shipping address with ID ${addressId} for user ID ${userId}`);
    }

    console.log(`Successfully deleted shipping address ${addressId} for user ID ${userId}`);
    return result;
}

async function deleteUserProfile(requestBody) {
    const { userId } = requestBody;

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