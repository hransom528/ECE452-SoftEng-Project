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
This is an implementation of the Cart where a user can add or remove items based on the userID, productId, and quantity. 
Additionally a user can retrieve their cart through a GET request. 

// curl -X POST http://localhost:3000/remove-from-cart -H "Content-Type: application/json" -d '{"userId":"65fb26fd8ee7dfe76e1b0dcd", "productId":"65f8ede18c06f461ae617087", "quantityToRemove":50}'
// curl -X POST http://localhost:3000/add-to-cart -H "Content-Type: application/json" -d '{"userId":"65fb26fd8ee7dfe76e1b0dcd", "productId":"65f8ede18c06f461ae617087", "quantityToRemove":50}'  
//curl "http://localhost:3000/remove-from-cart?userId=65fb26fd8ee7dfe76e1b0dcd&productId=65f8ede18c06f461ae617087&quantityToRemove=50"

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

