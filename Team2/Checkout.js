//Checkout with stripe

const { createStripeCustomerAndUpdateDB, verifyCardAndUpdateDB } = require('./stripeFunctions');

// Checkout handler function
async function checkout(req, res) {
  try {
    const { userObjectId, email, name, stripeToken } = req.body;

    // Create a Stripe customer and update MongoDB with the customer ID
    const customerResult = await createStripeCustomerAndUpdateDB(userObjectId, email, name);
    if (!customerResult.success) {
      return res.status(400).json({ error: customerResult.message });
    }

    // Verify card details and update MongoDB with payment method ID
    const cardResult = await verifyCardAndUpdateDB(userObjectId, customerResult.stripeCustomerId, stripeToken);
    if (!cardResult.success) {
      return res.status(400).json({ error: 'Failed to verify card details' });
    }

    // Payment successful, you can send a success response here
    res.json({ message: 'Payment successful' });
  } catch (error) {
    console.error('Error processing checkout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { checkout };
