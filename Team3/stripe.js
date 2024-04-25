require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig.js');
const mongoURI = process.env.MONGO_URI;
// Function to create a new Stripe customer and update the MongoDB database
async function createStripeCustomerAndUpdateDB(userObjectId, email, name) {
    // Ensure necessary configuration is present
    if (!mongoURI || !process.env.STRIPE_SECRET_KEY) {
        throw new Error("Configuration error: Ensure all environment variables are set.");
    }

    // Input validation
    if (!ObjectId.isValid(userObjectId)) {
        return { success: false, message: "Invalid user object ID." };
    }
    if (typeof email !== "string" || !email.includes("@")) {
        return { success: false, message: "Invalid email address." };
    }
    if (typeof name !== "string" || name.trim().length === 0) {
        return { success: false, message: "Invalid name." };
    }

    try {
        const db = await connectDB();
        const users = db.collection('users');

        // Check for an existing user document by ID and email
        const existingUser = await users.findOne({ _id: new ObjectId(userObjectId), email: email });
        if (!existingUser) {
            return {
                success: false,
                message: 'No user found with the provided email and user ID.'
            };
        }
          // Check if the email matches the user document's email
          if (existingUser.email !== email) {
            return {
                success: false,
                message: 'No such email address associated with the given name and user ID.'
            };
        }
        // Check if the name matches the user document's name
        if (existingUser.name !== name) {
            return {
                success: false,
                message: 'No such name found with the given email and user ID.'
            };
        }

        // Check for an existing Stripe customer ID
        if (existingUser.stripeCustomerId) {
            return {
                success: false,
                message: 'Stripe customer already exists for this user.',
                stripeCustomerId: existingUser.stripeCustomerId
            };
        }

        // Create Stripe customer
        const customer = await stripe.customers.create({ email, name });

        // Update MongoDB user document with Stripe customer ID
        await users.updateOne(
            { _id: new ObjectId(userObjectId) },
            { $set: { stripeCustomerId: customer.id } }
        );

        console.log(`Stripe customer created and DB updated for user ID: ${userObjectId}`);
        return { success: true, stripeCustomerId: customer.id };
    } catch (error) {
        console.error(`Error in createStripeCustomerAndUpdateDB: ${error.message}`);
        return { success: false, message: 'An error occurred while creating Stripe customer.' };
    }
}

// Function to verify card details and update the MongoDB database
async function verifyCardAndUpdateDB(userObjectId, stripeCustomerId, stripeToken) {
    const db = await connectDB();
    const users = db.collection('users');
    const errors = [];
  
    // Input validation
    if (!ObjectId.isValid(userObjectId)) {
      errors.push("Invalid user object ID.");
    }
    if (typeof stripeCustomerId !== "string" || stripeCustomerId.trim().length === 0) {
      errors.push("Invalid Stripe customer ID.");
    }
    if (typeof stripeToken !== "string" || stripeToken.trim().length === 0) {
      errors.push("Invalid Stripe token.");
    }
  
    // Aggregate and return all input validation errors
    if (errors.length > 0) {
      return { success: false, message: errors.join(" ") };
    }
  
    try {
      console.log("Verifying card details...");
  
      // Retrieve user from MongoDB
      const user = await users.findOne({ _id: new ObjectId(userObjectId) });
      if (!user) {
        throw new Error("User not found in the database.");
      }
  
      // Retrieve the Stripe customer to check for existing payment methods
      let stripeCustomer;
      try {
        stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);
      } catch (err) {
        if (err.statusCode === 404) {
          throw new Error("Stripe customer ID does not exist on Stripe.");
        } else {
          // Re-throw the error for any other issues
          throw err;
        }
      }
  
      // Check if a default payment method is already set for the Stripe customer
      if (stripeCustomer.invoice_settings && stripeCustomer.invoice_settings.default_payment_method) {
        return { success: false, message: "There is already a default payment method set up for this customer." };
      }
  
      // Create a payment method using the provided token
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: { token: stripeToken }
      });
      console.log("Payment method created:", paymentMethod.id);
  
      // Attach the payment method to the Stripe customer
      await stripe.paymentMethods.attach(paymentMethod.id, { customer: stripeCustomerId });
      console.log("Payment method attached to customer:", paymentMethod.id);
  
      // Update the Stripe customer to have the new payment method as default
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: { default_payment_method: paymentMethod.id }
      });
      console.log("Default payment method set for customer:", stripeCustomerId);
  
      // Update the user document in MongoDB with the new payment method ID
      await users.updateOne(
        { _id: new ObjectId(userObjectId) },
        { $set: { paymentMethodId: paymentMethod.id } }
      );
      console.log("MongoDB user document updated with new payment method ID:", paymentMethod.id);
  
      return { success: true, paymentMethodId: paymentMethod.id };
    } catch (error) {
      console.error("Error verifying card details:", error);
      return { success: false, message: error.message };
    }
  }
  async function createPaymentAndProcessing(stripeCustomerId, paymentMethodId, amountInDollars) {
    const errors = [];
  
    // Input validation for Stripe customer ID and payment method ID
    if (typeof stripeCustomerId !== "string" || stripeCustomerId.trim().length === 0) {
      errors.push("Invalid Stripe customer ID.");
    }
    if (typeof paymentMethodId !== "string" || paymentMethodId.trim().length === 0) {
      errors.push("Invalid payment method ID.");
    }
    // Validate the amount to ensure it's a positive number
    if (typeof amountInDollars !== "number" || amountInDollars <= 0) {
      errors.push("Invalid amount to be charged. Amount must be a positive number.");
    }
  
    // Aggregate and return all input validation errors
    if (errors.length > 0) {
      return { success: false, message: errors.join(" ") };
    }
  
    try {
      console.log("Creating and processing payment...");
      
      // Verify Stripe customer and payment method exist and are valid
      try {
        await stripe.customers.retrieve(stripeCustomerId);
        await stripe.paymentMethods.retrieve(paymentMethodId);
      } catch (err) {
        // If there's an error in retrieving Stripe customer or payment method, it's likely invalid
        return { success: false, message: "Stripe customer ID or payment method ID is invalid." };
      }
  
      // Convert amount from dollars to cents for Stripe
      const amountInCents = Math.round(amountInDollars * 100); // Ensures amount is in whole cents
      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        customer: stripeCustomerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
      });
      console.log("Payment intent created:", paymentIntent.id);
      return { success: true, paymentIntentId: paymentIntent.id, status: paymentIntent.status };
    } catch (error) {
      console.error("Error creating and processing payment:", error);
      return { success: false, message: "Failed to create or process payment. " + error.message };
    }
  }  

  async function refundPayment(stripeCustomerId, paymentIntentId, reason) {
    // Input validation
    if (typeof stripeCustomerId !== 'string' || stripeCustomerId.trim().length === 0) {
        return { success: false, message: 'Invalid Stripe customer ID.' };
    }
    if (typeof paymentIntentId !== 'string' || paymentIntentId.trim().length === 0) {
        return { success: false, message: 'Invalid payment intent ID.' };
    }
    if (typeof reason !== 'string' || reason.trim().length === 0) {
        return { success: false, message: 'Invalid refund reason.' };
    }

    try {
        // Create a refund
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: reason, // possible reasons are 'duplicate', 'fraudulent', 'requested_by_customer', or 'other'
        });

        console.log(`Refund created with ID: ${refund.id} for payment intent ID: ${paymentIntentId}`);
        return { success: true, refundId: refund.id, status: refund.status };
    } catch (error) {
        console.error(`Error refunding payment: ${error.message}`);
        return { success: false, message: `Failed to refund payment. ${error.message}` };
    }
}

  
module.exports = {
    createStripeCustomerAndUpdateDB,
    verifyCardAndUpdateDB,
    createPaymentAndProcessing,
    refundPayment,
};
