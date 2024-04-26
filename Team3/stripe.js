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
  async function addBankTransferAccount(stripeCustomerId, accountNumber, routingNumber, accountHolderName, accountHolderType) {
    const errors = [];

    // Input validation for the Stripe customer ID
    if (typeof stripeCustomerId !== "string" || stripeCustomerId.trim().length === 0) {
        errors.push("Invalid Stripe customer ID.");
    }

    // More input validations can be added here as needed...

    // Aggregate and return all input validation errors
    if (errors.length > 0) {
        return { success: false, message: errors.join(" ") };
    }

    try {
        // Create a bank account token
        const bankAccountToken = await stripe.tokens.create({
            bank_account: {
                country: 'US',
                currency: 'usd',
                account_holder_name: accountHolderName,
                account_holder_type: accountHolderType, 
                routing_number: routingNumber,
                account_number: accountNumber,
            },
        });

        // Attach the bank account token to the Stripe customer as a new payment method
        const bankAccount = await stripe.customers.createSource(stripeCustomerId, {
            source: bankAccountToken.id,
        });

        console.log("Bank account attached to customer:", bankAccount.id);
        return { success: true, bankAccountId: bankAccount.id };
    } catch (error) {
        console.error("Error attaching bank account:", error);
        return { success: false, message: "Failed to attach bank account. " + error.message };
    }
}

async function createPaymentAndProcessing(stripeCustomerId, id, amount, currency, idType) {
    const errors = [];

    // Input validation for Stripe customer ID
    if (typeof stripeCustomerId !== "string" || stripeCustomerId.trim().length === 0) {
        errors.push("Invalid Stripe customer ID.");
    }
    
    // Validate the ID based on the type
    if (typeof id !== "string" || id.trim().length === 0) {
        errors.push(`Invalid ${idType} ID.`);
    }

    // Validate the amount to ensure it's a positive number
    if (typeof amount !== "number" || amount <= 0) {
        errors.push("Invalid amount to be charged. Amount must be a positive number.");
    }

    // Validate the currency code
    if (typeof currency !== "string" || currency.trim().length !== 3) {
        errors.push("Invalid currency code. Currency code must be in ISO 4217 format.");
    }

    // Aggregate and return all input validation errors
    if (errors.length > 0) {
        return { success: false, message: errors.join(" ") };
    }

    try {
        console.log("Creating and processing payment...");

        // Validate currency and calculate amount in minor units appropriately
        // This is a simplified example, you might need more complex logic to handle all currencies correctly
        let amountInMinorUnits;
        if (currency.toLowerCase() === 'jpy') { // Japanese Yen does not have minor currency units
            amountInMinorUnits = amount;
        } else {
            amountInMinorUnits = Math.round(amount * 100);
        }

        // Specify payment method types based on the idType
        const paymentMethodTypes = idType === 'ach_debit' ? ['ach_debit'] : ['card'];

        // Create a payment intent with the specified currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInMinorUnits,
            currency: currency.toLowerCase(),
            customer: stripeCustomerId,
            off_session: true,
            confirm: true,
            [idType === 'ach_debit' ? 'payment_method_types' : 'payment_method']: idType === 'ach_debit' ? paymentMethodTypes : id,
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
    addBankTransferAccount,
};
