const fetch = require('node-fetch');
const { connectDBandClose } = require('../../dbConfig.js');
const { ObjectId } = require('mongodb');
const { createStripeCustomerAndUpdateDB, verifyCardAndUpdateDB, createPaymentAndProcessing } = require('../../Team3/stripe.js');

// Function to create a Stripe token
async function createStripeToken(paymentInfo) {
    try {
        const response = await fetch('https://api.stripe.com/v1/tokens', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer sk_test_4eC39HqLyjWDarjtT1zdp7dc', // Replace with your actual test API key
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'card[number]': paymentInfo.card.replace(/\s/g, ''), // Remove spaces from card number
                'card[cvc]': paymentInfo.cvv,
                'card[exp_month]': paymentInfo.exp_month,
                'card[exp_year]': paymentInfo.exp_year
            }).toString()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Error from Stripe: ${data.error && data.error.message}`);
        }

        // Test card 
        if (paymentInfo.card == "4242 4242 4242 4242") {
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
async function purchasePremiumMembership(userId, cardInfo) {
    try {
        const { db, client } = await connectDBandClose();
        
        // Create Stripe Token
        const stripeToken = await createStripeToken(cardInfo);

        // Create Stripe customer and update DB
        const user = await db.collection('users').findOne({ _id: ObjectId(userId) });
        const stripeCustomerId = await createStripeCustomerAndUpdateDB(userId, user.email, user.name);

        // Verify Card and create charge
        const paymentMethodId = await verifyCardAndUpdateDB(userId, stripeCustomerId, stripeToken);
        const membershipFee = 2000; // $20 in cents for Stripe
        const charge = await createPaymentAndProcessing(stripeCustomerId, paymentMethodId, membershipFee, 'usd');

        // Update user's premium status
        await db.collection('users').updateOne({ _id: ObjectId(userId) }, { $set: { isPremium: true } });

        client.close();
        return { success: true, message: "Membership purchased successfully." };
    } catch (error) {
        console.error('Purchase Premium Membership Error:', error);
        return { success: false, message: error.message };
    }
}

module.exports = { purchasePremiumMembership };
