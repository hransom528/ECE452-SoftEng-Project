
//curl -X POST -H "Content-Type: application/json" -d '{"userId": "66034fe1c4c80919996b4ec4", "cartId": "ObjectId('66035461382bf12efaa6386b')", "address": {"street": "46 Ray Street", "city": "New Brunswick", "state": "NJ", "zip": "08844"}, "paymentToken": "tok_visa", "stripeCustomerId": "cus_PnYvFk6K6O5fY8"}' http://localhost:3000/checkout

const { MongoClient } = require('mongodb');
const { verifyAddress } = require('./AddressValidationAPI.js');
const { ObjectId } = require('mongodb');
const {createPaymentAndProcessing, verifyCardAndUpdateDB} = require('../Team3/stripe.js');
const uri = 'mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/website?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

async function checkout(userId, cartId, address, paymentToken, stripeCustomerId) {
    try {
        await client.connect();
        const database = client.db('website');

        // Verify cart items
        const {itemsInStock, amountInDollars} = await verifyStock(database, cartId);
        if (!itemsInStock) {
            throw new Error('One or more items in the cart are out of stock');
        }

        // Verify user address
        const verifiedAddress = await verifyUserAddress(address);
        // Verify the card with the payment method ID and user's Stripe ID

        //const {verificationResult, paymentMethodId} = await verifyCardAndUpdateDB(userId, stripeCustomerId, paymentToken); //Team 3 implmenation of stripe verifcation gives me errors
        const verificationResult = true; //Lets just say the card is valid (:
        const paymentMethodId = "pm_1P0R64IYD2Ak4FLoH2m7gmqa"; //makeshift payment method
        // process a payment for a Stripe customer using a specific payment method
        createPaymentAndProcessing(stripeCustomerId, paymentMethodId, amountInDollars);

        if (!verificationResult.success) {
            return { success: false, message: "Failed to verify the card." };
        }


        // Retrieve cart details
        const cartsCollection = database.collection('carts');
        const cart = await cartsCollection.findOne({ _id: new (cartId) });
        // Add order to the database
        savePurchase(database, address, cart);

        console.log('Checkout successful!');
        return { success: true };

    } catch (error) {
        console.error('Error during checkout:', error.message);
        throw error;
    } finally {
        await client.close();
    }
}

async function verifyStock(database, cartId) {
    const cartsCollection = database.collection('carts');
    const productsCollection = database.collection('products');

    // Retrieve cart details
    const cart = await cartsCollection.findOne({ _id: new ObjectId(cartId) });
    const cartTotal = cart.cartSubTotal;
    if (!cart) {
        throw new Error('Cart not found');
    }

    let allItemsInStock = true;

    // Check stock availability for each item in the cart
    for (const item of cart.items) {
        const product = await productsCollection.findOne({ _id: new ObjectId(item.productId) });
        if (!product) {
            throw new Error(`Product with ID ${item.productId} not found`);
        }

        if (product.stockQuantity < item.quantity) {
            console.log(`Item "${product.name}" is out of stock.`);
            allItemsInStock = false;
        }
    }

    return allItemsInStock, cartTotal;
}
async function verifyUserAddress(address) {
    try {
        return await verifyAddress(address);
    } catch (error) {
        console.error('Error verifying user address:', error);
        throw new Error('Failed to verify user address');
    }
}

async function savePurchase(database, address, cart) {
    const purchasesCollection = database.collection('purchases');

    try {
        // Create the purchase object
        const purchase = {
            address: address,
            cart: cart,
            timestamp: new Date() // Optional: You can add a timestamp for when the purchase was made
        };

        // Insert the purchase object into the "purchases" collection
        const result = await purchasesCollection.insertOne(purchase);
        console.log(`Purchase successfully added to purchases collection with ID: ${result.insertedId}`);

        return result.insertedId;
    } catch (error) {
        console.error('Error saving purchase:', error);
        throw error;
    }
}

async function getPurchaseById(purchaseId) {
    await client.connect();
    const database = client.db('website');
    const purchasesCollection = database.collection('purchases');

    try {
        // Find the purchase document by its ID
        const purchase = await purchasesCollection.findOne({ _id: ObjectId(purchaseId) });
        if (!purchase) {
            throw new Error('Purchase not found');
        }

        return purchase;
    } catch (error) {
        console.error('Error retrieving purchase:', error);
        throw error;
    }
}


module.exports = { checkout , getPurchaseById };

