const fetch = require('node-fetch');
const { connectDBandClose } = require('../../dbConfig.js');
const { ObjectId } = require('mongodb');
const { createStripeCustomerAndUpdateDB, verifyCardAndUpdateDB, createPaymentAndProcessing } = require('../../Team3/stripe.js');
const { getUserInfo } = require('../Reg_lgn/oAuthHandler.js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Assuming your Stripe secret key is stored in environment variables

// Function to create a Stripe token
async function createStripeToken(paymentInfo) {
    try {
        const data = await stripe.tokens.create({
            card: {
                number: paymentInfo.card.number,
                exp_month: paymentInfo.card.exp_month,
                exp_year: paymentInfo.card.exp_year,
                cvc: paymentInfo.card.cvc
            }
        });

        // Test card 
        if (paymentInfo.card.number === "4242 4242 4242 4242") {
            return {
                tokenId: 'tok_visa',
                cardBrand: data.card.brand,
                cardLast4: data.card.last4,
                cardExpDate: `${data.card.exp_month}/${data.card.exp_year}`
            };
        } else {
            return {
                tokenId: data.id,
                cardBrand: data.card.brand,
                cardLast4: data.card.last4,
                cardExpDate: `${data.card.exp_month}/${data.card.exp_year}`
            };
        }
    } catch (error) {
        console.error('Failed to create token:', error);
        throw error;
    }
}
  
// Function to purchase premium membership
async function purchasePremiumMembership(accessToken, stripeToken) {
    try {
        if (!stripeToken) {
            throw new Error("Stripe token is missing.");
        }

        const userInfo = await getUserInfo(accessToken);
        const { db, client } = await connectDBandClose();
        const user = await db.collection('users').findOne({ email: userInfo.email });
        if (!user) {
            client.close();
            throw new Error("User not found.");
        }

        const result1 = await createStripeCustomerAndUpdateDB(user._id, user.email, user.name); //paymentInfo.name
        
        const stripeCustomerId = result1.stripeCustomerId;
        if (!result1.success) {
          throw new Error(result1.message);
        }
        console.log("Stripe token is ", stripeToken);
        const result2 = await verifyCardAndUpdateDB(user._id, stripeCustomerId, stripeToken); 
        if (!result2.success) {
          throw new Error(result2.message);
        }
        const paymentMethodId = result2.paymentMethodId;
        const membershipFee = 19.99;

        const result3 = await createPaymentAndProcessing(stripeCustomerId, paymentMethodId, membershipFee, 'usd', 'pm_card_visa'); //payment_method
        if (!result3.success) {
          throw new Error(result3.message);
        }

        // Update user's premium status in your database
        await db.collection('users').updateOne({ _id: user._id }, { $set: { isPremium: true } });

        client.close();
        return { success: true, message: "Membership purchased successfully." };
    } catch (error) {
        console.error('Purchase Premium Membership Error:', error);
        client?.close(); // Ensure to close the client if an error occurs
        return { success: false, message: error.message };
    }
}

async function cancelPremiumMembership(req, res) {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Unauthorized: No access token provided' }));
        return;
    }

    try {
        const userInfo = await getUserInfo(accessToken);
        const { db, client } = await connectDBandClose();
        const user = await db.collection('users').findOne({ email: userInfo.email });
        if (!user) {
            client.close();
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User not found' }));
            return;
        }

        // Cancel the Stripe subscription if there's one active
        if (user.stripeSubscriptionId) {
            await stripe.subscriptions.del(user.stripeSubscriptionId);
        }

        // Update the user's premium status in the database
        await db.collection('users').updateOne({ _id: user._id }, { $set: { isPremium: false } });

        client.close();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: "Premium membership cancelled successfully." }));
    } catch (error) {
        console.error('Error cancelling premium membership:', error);
        client?.close();
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: error.message }));
    }
}

module.exports = { purchasePremiumMembership, cancelPremiumMembership };
