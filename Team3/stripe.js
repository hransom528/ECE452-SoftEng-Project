const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);


async function createPaymentIntent(amount, currency) {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount, 
            currency,
        });

        return { clientSecret: paymentIntent.client_secret };
    } catch (error) {
        console.error("Error creating payment intent:", error);
        throw error;
    }
}
async function saveCard(paymentMethodId, customerId) {
    try {
        await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
        await stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: paymentMethodId },
        });
        return { success: true };
    } catch (error) {
        console.error("Error saving card:", error);
        throw error;
    }
}

module.exports = { createPaymentIntent, saveCard };