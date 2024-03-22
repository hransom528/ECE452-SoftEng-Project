const stripe = require('stripe')('pk_test_51Ot8H8IYD2Ak4FLoPHpmVZsGQY9mtmlaJBqmDxQvuqi6HsM9oDkIal74YGlJDw0LuWqNxb8r1eD8cH1Q2yjGtvpW00crbHgrlB'); // Replace with your Stripe secret key

async function createPremiumMembership(userId, paymentMethodId) {
    // have Stripe Customer ID and Price ID stored/configured
    const customer = /* retrieve or create the Stripe Customer ID for the given userId */;
    const priceId = /* Stripe Price ID for premium membership */;

    try {
        const subscription = await stripe.subscriptions.create({
            customer: customer,
            items: [{ price: priceId }],
            default_payment_method: paymentMethodId,
            expand: ['latest_invoice.payment_intent'],
        });

        console.log("Created premium membership for user", userId);
        return subscription;
    } catch (error) {
        console.error("Failed to create premium membership", error);
        throw error;
    }
}

async function cancelPremiumMembership(userId) {
    const subscriptionId = /* retrieve the Stripe Subscription ID for the given userId */;
    
    try {
        const canceledSubscription = await stripe.subscriptions.del(subscriptionId);
        
        console.log("Cancelled premium membership for user", userId);
        return canceledSubscription;
    } catch (error) {
        console.error("Failed to cancel premium membership", error);
        throw error;
    }
}

module.exports = { createPremiumMembership, cancelPremiumMembership };
