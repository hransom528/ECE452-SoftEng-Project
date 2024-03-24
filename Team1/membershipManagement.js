const { connectDB } = require('../dbConfig');
const { ObjectId } = require('mongodb');

// Will implement Stripe validation later. For now, assuming payment is valid.

async function getUserById(userId) {
    const db = await connectDB();
    const collection = db.collection('users');

    const user = await collection.findOne({ _id: new ObjectId(userId) });
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


async function createPremiumMembership(userId, paymentMethodId) {
    const user = await getUserById(userId);

    if (user.isPremium) {
        console.log("User is already a premium member.");
        return { success: false, message: "User is already a premium member." };
    }

    // Verify the card with the payment method ID and user's Stripe ID
    try {
        const verificationResult = await verifyCard(paymentMethodId, user.stripeId);

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
            // Handle failure to verify the card
            return { success: false, message: "Failed to verify the card." };
        }
    } catch (error) {
        // Handle exceptions during the verification process
        console.error("Error during card verification:", error);
        throw error;
    }
}

async function cancelPremiumMembership(userId) {
    const user = await getUserById(userId);

    if (!user.isPremium) {
        console.log("User is not a premium member.");
        return false; // Indicates no action was taken since the user is not premium
    }

    const updateSucceeded = await updateUserPremiumStatus(userId, false);
    if (updateSucceeded) {
        console.log("Cancelled premium membership for user", userId);
        return true; // Indicates successful update
    } else {
        console.error("Failed to update user's premium status");
        return false;
    }
}

module.exports = { createPremiumMembership, cancelPremiumMembership };