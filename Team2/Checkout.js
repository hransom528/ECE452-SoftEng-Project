const { MongoClient } = require('mongodb');
const { verifyAddress } = require('./GoogleAddressValidation.js');
const {verifyCardAndUpdateDB, createStripeCustomerAndUpdateDB} = require('../Team3/stripe.js');
// MongoDB connection URI
//curl -X POST -H "Content-Type: application/json" -d '{"userId": "65fb26fd8ee7dfe76e1b0dcd", "cartId": "66035461382bf12efaa6386b", "address": {"street": "46 Ray Street", "city": "New Brunswick", "state": "NJ", "zip": "08844"}, "paymentToken": "tok_visa", "stripeCustomerId": "cus_PnYvFk6K6O5fY8"}' http://localhost:3000/checkout

const uri = 'mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/website?retryWrites=true&w=majority&appName=Cluster0';




const client = new MongoClient(uri);
//--------------------------
//const MongoClient = require('mongodb').MongoClient;

// Function to verify stock availability for items in the cart
async function verifyStock(cartId) {
    try {
        await client.connect();

        const database = client.db('website');
        const cartsCollection = database.collection('carts');
        const productsCollection = database.collection('products');

        // Retrieve cart details
        const cart = await cartsCollection.findOne({ _id: cartId });
        if (!cart) {
            throw new Error('Cart not found');
        }

        let allItemsInStock = true;

        // Check stock availability for each item in the cart
        for (const item of cart.items) {
            const product = await productsCollection.findOne({ _id: item.productId });
            if (!product) {
                throw new Error(`Product with ID ${item.productId} not found`);
            }

            if (product.stockQuantity < item.quantity) {
                console.log(`Item "${product.name}" is out of stock.`);
                allItemsInStock = false;
            }
        }

        return allItemsInStock;
    } catch (error) {
        console.error('Error verifying stock:', error);
        return false;
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
// Function to write order details to the "purchases" collection
async function createPurchase(orderId) {

    try {
        await client.connect();

        const database = client.db('website');
        const purchasesCollection = database.collection('purchases');

        // Retrieve the order details using the provided order ID
        const order = await getOrderById(orderId);
        if (!order) {
            throw new Error('Failed to retrieve order details');
        }

        // Insert the order details into the "purchases" collection
        const result = await purchasesCollection.insertOne(order);
        console.log(`Order successfully added to purchases collection with ID: ${result.insertedId}`);
        return result.insertedId;
    } catch (error) {
        console.error('Error creating purchase:', error);
        return null;
    } finally {
        await client.close();
    }
}

// Checkout function
async function checkout(userId, cartId, address, paymentToken, stripeCustomerId, stripeCustomerId) {
    const database = client.db('website');

    try {
        // Verify cart items
        const itemsInStock = await verifyStock(cartId);
        if (itemsInStock) {
            throw new Error('One or more items in the cart are out of stock');
        }

        // Verify user address
        const verifiedAddress = await verifyUserAddress(address);
        const stripeToken = 'tok_visa';
        // Verify the card with the payment method ID and user's Stripe ID
        try {
            //const verificationResult = await verifyCardAndUpdateDB(userId, stripeCustomerId, stripeToken);
            const verificationResult = true;
            if (verificationResult.success) {
                // If card verification is successful, update orders collection
                //const updateSucceeded = await updateUserPremiumStatus(userId, true);

            } else {
                // Handle failure to verify the card
                return { success: false, message: "Failed to verify the card." };
            }
        } catch (error) {
            // Handle exceptions during the verification process
            console.error("Error during card verification:", error);
            throw error;
        }

        // Add order to the database
        createPurchase(orderId)

        console.log('Checkout successful!');
    

    } catch (error) {
        console.error('Error during checkout:', error.message);
        throw error;
    }
}



module.exports = {checkout};
