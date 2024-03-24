// registration.js
const { connectDB } = require('../../dbConfig');
const { ObjectId } = require('mongodb');

async function registerUser(userInfo, requestBody) {
    const db = await connectDB();
    const usersCollection = db.collection('users');

    try {
        // Check if the user already exists
        const existingUser = await usersCollection.findOne({ email: userInfo.email });
        if (existingUser) {
            // User already exists
            return { success: false, message: 'User already registered.', userId: existingUser._id };
        } else {
            // If the user is new, create a new user object including the data from Google
            const newUser = {
                email: userInfo.email,
                name: userInfo.name,
                isPremium: requestBody.premium,
                stripeID: 'NA FOR NOW',
                shippingAddressses: requestBody.address,
                shoppingCart: { cartId: '', items: [], cartSubtotal: 0.0 },
                watchlist: [],
                orderHistory: [],
                reviews: []
            };

            // Insert the new user into the database
            const result = await usersCollection.insertOne(newUser);
            return { success: true, message: 'User registered successfully.', userId: result.insertedId };
        }
    } catch (error) {
        console.error('Error during registration:', error);
        throw new Error('Error during registration.');
    }
}

module.exports = { registerUser };
