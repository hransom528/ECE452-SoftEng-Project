const fetch = require('node-fetch'); // Ensure you have 'node-fetch' installed if running in Node.js

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

    return {
      tokenId: data.id, // Return the full token ID
      cardBrand: data.card.brand,
      cardLast4: data.card.last4,
      cardExpDate: `${data.card.exp_month}/${data.card.exp_year}`
    };
  } catch (error) {
    console.error('Failed to create token:', error);
    throw error;
  }
}

// Example usage
const paymentInfo = {
    card: "2444 2444 2444 2444",
    cvv: "123",
    exp_month: 1,
    exp_year: 2025,
    name: "John Doe"
};

createStripeToken(paymentInfo)
  .then(data => console.log(data))
  .catch(error => console.log('Error:', error));
