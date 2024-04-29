const { connectDBandClose } = require('../dbConfig');
const { ObjectId } = require('mongodb');
const {createPaymentAndProcessing, verifyCardAndUpdateDB, createStripeCustomerAndUpdateDB} = require('../Team3/stripe.js');
const { verifyAddress } = require('./AddressValidationAPI.js');
const fetch = require('node-fetch'); // Ensure you have 'node-fetch' installed if running in Node.js
const nodemailer = require('nodemailer');



//Code to send confirmation email to user
async function sendConfirmationEmail(user, purchaseDetails) {
  // Create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Your SMTP server
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'gymhavenbusiness@gmail.com', // Your email
      pass: 'Software123' // Your email password
    }
  });



  // Prepare email contents
  let info = await transporter.sendMail({
    from: '"Gym Haven" gymhavenbusiness@gmail.com', // Sender address
    to: user.email, // Recipient address from the user object
    subject: 'Purchase Confirmation', // Subject line
    text: `Hello, ${user.name}\n\nThank you for your purchase.\n\nOrder details:\nTotal: ${purchaseDetails.total}`, // Plain text body
    html: `<b>Hello, ${user.name}</b><br><br>Thank you for your purchase.<br><br><b>Order details:</b><br>Total: ${purchaseDetails.total}` // HTML body content
  });

  console.log('Message sent: %s', info.messageId);
}



// generate Stripe token using card info
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
    if (paymentInfo.card == "4242 4242 4242 4242"){
      return {
        tokenId: 'tok_visa',
        cardBrand: data.card.brand,
        cardLast4: data.card.last4,
        cardExpDate: `${data.card.exp_month}/${data.card.exp_year}`
      };
    }
    else {
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

// Function to get cart info for current user
async function getCartByUserId(userId) {
    const { db, client } = await connectDBandClose();
    const collection = db.collection('carts');

    // Make sure to use ObjectId for the userId if it's stored as ObjectId in the carts collection
    const cart = await collection.findOne({ userId: new (userId) });
    return cart;
}

// Function to verify that all cart items are in stock + cart is not empty
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

async function calculateTax(subtotal){
  const total = subtotal * 1.07;
  return total;
}

//Checkout Function
async function checkoutCart(userId, billingAddr, shippingAddr, paymentInfo) {
    let client;
    try {

        const { db, client: dbClient } = await connectDBandClose();
        client = dbClient;

        //-----------------------------------------
        // Verify Items are in stock
        //-----------------------------------------
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

        
        //-----------------------------------------
        // Verify Shipping and Billing Address 
        // with Address Validation API
        //-----------------------------------------
        const resultB = await verifyAddress(billingAddr);
        if (!resultB.isValid) {
           throw new Error(resultB.message);
        }
        console.log("Successful billing address verifcaition");

        //Verify Shipping Address
        const resultS = await verifyAddress(shippingAddr);
         if (!resultS.isValid) {
           throw new Error(resultS.message);
        }
        console.log("Successful shipping address verifcaition");

        //-----------------------------------------
        // Proccess Payment w/ stripe
        //-----------------------------------------
        // calulate tax
        const total = await calculateTax(cartSubTotal);

        //Pull user email and name from data base  
        const collection = db.collection('users');// Find the user by their ObjectId
        const user = await collection.findOne({ _id: new ObjectId(userId) }, { projection: { email: 1, name: 1 } });
        const name = user.name;

        const email = user.email; //need to pull name from DB
        const paymentDetails = await createStripeToken(paymentInfo);
        const stripeToken = paymentDetails.tokenId;
        //const stripeToken = 'tok_visa';

        const result1 = await createStripeCustomerAndUpdateDB(userId, email, name); //paymentInfo.name
        
        const stripeCustomerId = result1.stripeCustomerId;
        if (!result1.success) {
          throw new Error(result1.message);
        }
        console.log("Stripe token is ", stripeToken);
        const result2 = await verifyCardAndUpdateDB(userId, stripeCustomerId, stripeToken); 
        if (!result2.success) {
          throw new Error(result2.message);
        }
        const paymentMethodId = result2.paymentMethodId;
        
        const result3 = await createPaymentAndProcessing(stripeCustomerId, paymentMethodId, total, 'usd', 'pm_card_visa'); //payment_method
        if (!result3.success) {
          throw new Error(result3.message);
        }

        //-----------------------------------------
        // Store Purchase Info in DB
        //-----------------------------------------
        // Prepare purchase details document
        const purchaseDetails = {
        userId: new ObjectId(userId),
        items: cart.items,
        total: total, // Assuming total includes tax and/or shipping costs if applicable
        shippingAddr: {
            "street": shippingAddr.street,
            "city": shippingAddr.city,
            "state": shippingAddr.state, 
            "postalCode": shippingAddr.postalCode,
            "country": shippingAddr.country
        },
        billingAddr: {
            "street": billingAddr.street,
            "city": billingAddr.city,
            "state": billingAddr.state, 
            "postalCode": billingAddr.postalCode,
            "country": billingAddr.country
        },
        paymentDetails: {
            tokenId: paymentDetails.tokenId,
            cardBrand: paymentDetails.cardBrand,
            cardLast4: paymentDetails.cardLast4,
            cardExpDate: paymentDetails.cardExpDate
        },
        OrderStatus: "pending"
      };

      // Insert purchase details into 'purchases' collection
      await db.collection('purchases').insertOne(purchaseDetails);
      //-----------------------------------------
      // Send email confirmatoin of purchase
      //-----------------------------------------
      //await sendConfirmationEmail(user, purchaseDetails);


      //-----------------------------------------
      // handle error/return
      //-----------------------------------------
      console.log(`Checkout successful for user ${userId} with total: ${total}`);

        return { success: true, message: 'Checkout successful.', total };
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

