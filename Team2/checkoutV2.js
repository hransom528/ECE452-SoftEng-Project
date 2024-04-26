const { connectDBandClose } = require('../dbConfig');
const { ObjectId } = require('mongodb');
const {createPaymentAndProcessing, verifyCardAndUpdateDB} = require('../Team3/stripe.js');
const { verifyAddress } = require('./AddressValidationAPI.js');

async function getCartByUserId(userId) {
    const { db, client } = await connectDBandClose();
    const collection = db.collection('carts');

    // Make sure to use ObjectId for the userId if it's stored as ObjectId in the carts collection
    const cart = await collection.findOne({ userId: new ObjectId(userId) });
    return cart;
}

async function verifyItemsInStock(items) {
    const { db } = await connectDBandClose();
    const collection = db.collection('products');
    let areAllItemsInStock = true;
    let cartSubTotal = 0;

    for (const item of items) {
        // Use ObjectId for productIds as well
        const product = await collection.findOne({ _id: new ObjectId(item.productId) });
        if (!product || product.stockQuantity < item.quantity) {
            areAllItemsInStock = false;
            break;
        }
        cartSubTotal += product.price * item.quantity;
    }

    return { areAllItemsInStock, cartSubTotal };
}

async function checkoutCart(userId, billingAddr, shippingAddr, paymentInfo) {
    let client;
    try {
        const { db, client: dbClient } = await connectDBandClose();
        client = dbClient;

        const cart = await getCartByUserId(userId);
        if (!cart || cart.items.length === 0) {
            throw new Error('The cart is empty or not found.');
        }

        const { areAllItemsInStock, cartSubTotal } = await verifyItemsInStock(cart.items);
        if (!areAllItemsInStock) {
            throw new Error('One or more items in the cart are out of stock.');
        }

        // Update the cart subtotal and save it to the database
        await db.collection('carts').updateOne(
            { _id: cart._id }, // Use the cart's _id for the update operation
            { $set: { cartSubTotal } }
        );


        //Verify Billing Address
        const billingAddrVerification = verifyAddress(billingAddr);
        if (!billingAddrVerification) {
          throw new Error('Billing address not valid.');
        }
        console.log("Successful billing address verifcaition");

        //Verify Shipping Address
        const shippingAddrVerification = verifyAddress(shippingAddr);
        if (!shippingAddrVerification) {
          throw new Error('Shipping address not valid.');
        }
        console.log("Successful shipping address verifcaition");

        //----------------- NEED SHREY HELP HERE ---------------------
        // I am passing a variable in called payment info. 
        // The schema of this can contain credit card info, cvv, and name on card
        // Proceed with checkout process (e.g., payment processing)


        

        console.log(`Checkout successful for user ${userId} with subtotal: ${cartSubTotal}`);

        return { success: true, message: 'Checkout successful.', cartSubTotal };
    } catch (error) {
        console.error('Error during cart verification and checkout:', error);
        return { success: false, message: error.message };
    } finally {
        // Ensure that the client is defined before attempting to close it
        if (client) {
            await client.close();
        }
    }
}

module.exports = { checkoutCart };

