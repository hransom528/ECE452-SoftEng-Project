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
This is an implementation of the cart which a user can request to create. Additionally, they can add or remove items from the cart

- Add Product to Cart
  Method: POST
  Endpoint: http://localhost:3000/add-to-cart
  Body (JSON):
  {
    "userId": "user_id_here",
    "productId": "product_id_here"
    "quantity": "quantity_here"
  
  }

- Remove Product from Cart
  Method: POST
  Endpoint: http://localhost:3000/remove-from-cart
  Body (JSON):
  {
    "userId": "user_id_here",
    "productId": "product_id_here"
    "quantityToRemove: "quantity_To_Remove
  }

- retrieve your Cart
  Method: GET
  Endpoint: http://localhost:3000/fetch-cart-details
  Body (JSON):
  {
    "userId": "user_id_here",
  }




------------
Watchlist.js
------------
1. Start the server by running the following command:
   npm start
   This will start the application and connect it to your MongoDB database.

2. Open Postman and import the provided collection file (Watchlist.postman_collection.json).

3. You should see three requests in the collection:
   - Add Product to Watchlist: Used to add a product to a user's watchlist.
   - Remove Product from Watchlist: Used to remove a product from a user's watchlist.
   - Get User's Watchlist: Used to retrieve a user's watchlist.

4. Send requests to the appropriate endpoints using Postman to interact with the watchlist data.

API Endpoints:

- Add Product to Watchlist
  Method: POST
  Endpoint: http://localhost:3000/addToWatchList
  Body (JSON):
  {
    "userId": "user_id_here",
    "productId": "product_id_here"
  }

- Remove Product from Watchlist
  Method: POST
  Endpoint: http://localhost:3000/removeFromWatchList
  Body (JSON):
  {
    "userId": "user_id_here",
    "productId": "product_id_here"
  }

- Get User's Watchlist
  Method: GET
  Endpoint: http://localhost:3000/getWatchList?userId=user_id_here

Replace user_id_here and product_id_here with the appropriate values.

