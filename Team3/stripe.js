require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig.js');
const mongoURI = process.env.MONGO_URI;
// Function to create a new Stripe customer and update the MongoDB database
async function createStripeCustomerAndUpdateDB(userObjectId, email, name) {
  const db = await connectDB();
  const users = db.collection('users');
  // First, check if the user document already has a stripeCustomerId
  const existingUser = await users.findOne({ _id: new ObjectId(userObjectId) });

  if (existingUser && existingUser.stripeCustomerId) {
      return {
          success: false,
          message: 'Stripe customer already exists for this user.',
          stripeCustomerId: existingUser.stripeCustomerId
      };
  }

  // If no stripeCustomerId, proceed to create a new Stripe customer
  const customer = await stripe.customers.create({
      email: email,
      name: name
  });

  // Update MongoDB user document with the new Stripe customer ID
  await users.updateOne(
      { _id: new ObjectId(userObjectId) },
      { $set: { stripeCustomerId: customer.id } }
  );

  return { success: true, stripeCustomerId: customer.id };
}

// Function to verify card details and update the MongoDB database
async function verifyCardAndUpdateDB(userObjectId, stripeCustomerId, stripeToken) {
  const db = await connectDB();
  const users = db.collection('users');

  try {
      console.log("Verifying card details...");
      console.log("User Object ID:", userObjectId);
      console.log("Stripe Customer ID:", stripeCustomerId);
      console.log("Stripe Token:", stripeToken);

      // Create a payment method using the provided token
      const paymentMethod = await stripe.paymentMethods.create({
          type: 'card',
          card: {
              token: stripeToken
          }
      });

      console.log("Payment method created:", paymentMethod);

      // Attach the payment method to the Stripe customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
          customer: stripeCustomerId
      });

      console.log("Payment method attached to customer");

      // Update the Stripe customer to have the new payment method as default
      await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
              default_payment_method: paymentMethod.id
          }
      });
      console.log("Default payment method updated for customer");
      // Update the user document in MongoDB with the new payment method ID
      await users.updateOne(
          { _id: new ObjectId(userObjectId) },
          { $set: { paymentMethodId: paymentMethod.id } }
      );

      console.log("User document updated with payment method ID");

      return { success: true, paymentMethodId: paymentMethod.id };
  } catch (error) {
      console.error("Error verifying card details:", error);
      throw error;
  }
}

// Function to make and process a payment for a Stripe customer using a specific payment method
async function createPaymentAndProcessing(stripeCustomerId, paymentMethodId, amountInDollars) {
  try {
    console.log("Creating and processing payment...");
    console.log("Stripe Customer ID:", stripeCustomerId);
    console.log("Payment Method ID:", paymentMethodId);
    console.log("Amount in USD:", amountInDollars);

    // Convert amount from dollars to cents for Stripe
    const amountInCents = Math.round(amountInDollars * 100); // Ensures amount is in whole cents

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents, // Now using the converted amount
        currency: 'usd', // Specify the currency
        customer: stripeCustomerId,
        payment_method: paymentMethodId,
        off_session: true, // Assuming the customer is not present
        confirm: true, // Confirm the payment at the time of creation
    });

    console.log("Payment intent created:", paymentIntent);

    return { success: true, paymentIntentId: paymentIntent.id, status: paymentIntent.status };
  } catch (error) {
    console.error("Error creating and processing payment:", error);
    return { success: false, error: error.message };
  }
}


module.exports = {
    createStripeCustomerAndUpdateDB,
    verifyCardAndUpdateDB,
    createPaymentAndProcessing
};
