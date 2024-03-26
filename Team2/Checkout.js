const { MongoClient } = require('mongodb');
const { verifyAddress } = require('./GoogleAddressValidation.js');
const {verifyCardAndUpdateDB} = require('../Team3/stripe.js');
// MongoDB connection URI
//curl -X POST -H "Content-Type: application/json" -d '{"userId": "your_user_id", "cartId": "your_cart_id", "address": {"street": "123 Main St", "city": "Anytown", "state": "CA", "zip": "12345"}, "paymentToken": "your_payment_token"}' http://localhost:3000/checkout

const uri = 'mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Function to check if items in cart are still in stock
async function verifyCartItems(userId, cartId) {
    return true;
    try {
        await client.connect();
        const database = client.db('website');
        const cartsCollection = database.collection('carts');
        const productsCollection = database.collection('products');

        // Retrieve the cart
        const cart = await cartsCollection.findOne({ userID: userId, _id: cartId });
        if (!cart) {
            throw new Error('Cart not found');
        }

        // Check each item in the cart
        for (const item of cart.Items) {
            const product = await productsCollection.findOne({ _id: item.productId });
            if (!product || product.stockQuantity < item.quantity) {
                return false; // Item out of stock
            }
        }

        return true; // All items in stock
    } catch (error) {
        console.error('Error verifying cart items:', error);
        throw new Error('Failed to verify cart items');
    } finally {
        await client.close();
    }
}

// Function to verify user address
async function verifyUserAddress(address) {
    try {
        return await verifyAddress(address);
    } catch (error) {
        console.error('Error verifying user address:', error);
        throw new Error('Failed to verify user address');
    }
}

// Checkout function
async function checkout(userId, cartId, address, paymentToken) {
    try {
        // Verify cart items
        const itemsInStock = await verifyCartItems(userId, cartId);
        if (!itemsInStock) {
            throw new Error('One or more items in the cart are out of stock');
        }

        // Verify user address
        const verifiedAddress = await verifyUserAddress(address);

        // Add payment method
        const { success: paymentSuccess, paymentMethodId } = await verifyCardAndUpdateDB(userId, address.stripeCustomerId, paymentToken);
        if (!paymentSuccess) {
            throw new Error('Failed to add payment method');
        }

        // Proceed with checkout
        console.log('Checkout successful!');
        // Additional logic for checkout can be added here

    } catch (error) {
        console.error('Error during checkout:', error.message);
        throw error;
    }
}

/*// Example usage:
const userId = 'your_user_id';
const cartId = 'your_cart_id';
const address = {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
    stripeCustomerId: 'your_stripe_customer_id' // You need to get this from the user's document
};
const paymentToken = 'stripe_payment_token'; // You need to get this from the frontend

checkout(userId, cartId, address, paymentToken);

*/
module.exports = {checkout};