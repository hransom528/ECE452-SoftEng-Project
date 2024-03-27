Read Me file for Team 2

Purchase System:
UC-5 (Product Watchlist)
UC-6 (Cart/Checkout)
UC-12 (Purchase History)
Stripe API (implemented by TEAM 3)
EasyPost API
Google Address Validation API

------------
Checkout.js
------------
This is a Checkout implementation that handles the checkout portion of US-6 and the whole UC-12

Usage:
Checkout usage w/ curl
//curl -X POST -H "Content-Type: application/json" -d '{"userId": "66034fe1c4c80919996b4ec4", "cartId": "ObjectId('66035461382bf12efaa6386b')", "address": {"street": "46 Ray Street", "city": "New Brunswick", "state": "NJ", "zip": "08844"}, "paymentToken": "tok_visa", "stripeCustomerId": "cus_PnYvFk6K6O5fY8"}' http://localhost:3000/checkout

Get Purchase History w/ curl:

------------
Cart.js
------------


------------
Watchlist.js
------------

