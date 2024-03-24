const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);


/**
 * Verifies a payment method by attaching it to a Stripe customer.
 *
 * @param {string} paymentMethodId The ID of the payment method to attach.
 * @param {string} userStripeId The Stripe customer ID from your user database.
 * @returns {Promise<Object>} The result of the operation.
 */
async function createPaymentIntent(amount, currency) {
  try {
      const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency,
          payment_method_types: ['card'],
      });

      // Return the client secret and the payment intent ID if no errors occur
      return {
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
      };
  } catch (error) {
      console.error("Error creating payment intent:", error);
      throw error;
  }
}
async function verifyCard(paymentMethodId, userStripeId) {
    try {
        // Attach the payment method to the Stripe customer
        const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
            customer: userStripeId,
        });

        // Set the payment method as the default for the Stripe customer
        const customer = await stripe.customers.update(userStripeId, {
            invoice_settings: { default_payment_method: paymentMethod.id },
        });

        // Return success and details if no errors occur
        return {
            success: true,
            paymentMethodId: paymentMethod.id,
            customer: customer.id
        };
    } catch (error) {
        console.error("Error verifying card:", error);
        throw error;
    }
}

module.exports = { createPaymentIntent, verifyCard };
