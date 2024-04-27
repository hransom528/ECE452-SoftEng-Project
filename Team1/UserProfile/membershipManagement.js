const { connectDB } = require('../../dbConfig');
const { ObjectId } = require('mongodb');
const { verifyCardAndUpdateDB } = require('../../Team3/stripe.js'); // Adjust the path as necessary

async function getUserById(userId) {
    const db = await connectDB();
    const collection = db.collection('users');
    
    console.log(`Finding user with ID: ${userId}`); // Log the userId
    const query = { _id: new ObjectId(userId) };
    console.log(`Query: ${JSON.stringify(query)}`); // Log the exact query

    const user = await collection.findOne(query);
    console.log(`Found user: ${user}`); // Log the found user

    return user;
}

async function updateUserPremiumStatus(userId, isPremium) {
    const db = await connectDB();
    const collection = db.collection('users');

    const result = await collection.updateOne(
        { _id: new ObjectId(userId) }, // Convert string ID to ObjectId
        { $set: { isPremium: isPremium } }
    );
    return result.modifiedCount === 1;
}


async function createPremiumMembership(requestBody) {
    const { userId, stripeCustomerId, stripeToken } = requestBody;

    const user = await getUserById(userId);
    if (!user) {
        return { success: false, message: "No user found with the provided user ID." };
    }

    // Check if the user is already a premium member
    if (user.isPremium) {
        return { success: false, message: "User is already a premium member." };
    }

    // Verify the card with the payment method ID and user's Stripe ID
    try {
        const verificationResult = await verifyCardAndUpdateDB(userId, stripeCustomerId, stripeToken);
        if (verificationResult.success) {
            // If card verification is successful, update user's premium status
            const updateSucceeded = await updateUserPremiumStatus(userId, true);
            if (updateSucceeded) {
                console.log("Created premium membership for user", userId);
                return { success: true, message: "Premium membership created successfully." };
            } else {
                console.error("Failed to update user's premium status");
                return { success: false, message: "Failed to update user's premium status." };
            }
        } else {
            return { success: false, message: "Failed to verify the card." };
        }
    } catch (error) {
        console.error("Error during card verification:", error);
        throw error;
    }
}

async function cancelPremiumMembership(userId) {
    const user = await getUserById(userId);
    if (!user) {
        return { success: false, message: "No user found with the provided user ID." };
    }

    // Check if the user is not a premium member
    if (!user.isPremium) {
        return { success: false, message: "User is not a premium member." };
    }

    const updateSucceeded = await updateUserPremiumStatus(userId, false);
    if (updateSucceeded) {
        console.log("Cancelled premium membership for user", userId);
        return { success: true, message: "Premium membership cancelled successfully." };
    } else {
        console.error("Failed to update user's premium status");
        return { success: false, message: "Failed to update user's premium status." };
    }
}



module.exports = { createPremiumMembership, cancelPremiumMembership };