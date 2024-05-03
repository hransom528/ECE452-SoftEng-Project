Read Me file for Team 2

Purchase System:
UC-5 (Product Watchlist)
UC-6 (Cart/Checkout)
UC-12 (Purchase History)
Stripe API (implemented by TEAM 3)
EasyPost API
Google Address Validation API

------------
checkoutV2.js
------------
This is a Checkout implementation that handles the checkout portion of US-6

Usage: 
Method: POST
Endpoint:http://localhost:3000/checkout

Body (JSON):
{
    "userId": "662fd390bbe6d16f3f91f21b",

    "billingAddr":{
        "street": "1600 Amphitheatre Pkwy",
        "city": "Mountain View",
        "state": "CA", 
        "postalCode": "94043",
        "country": "USA"
    },
    "shippingAddr":{
        "street": "1600 Amphitheatre Pkwy",
        "city": "Mountain View",
        "state": "CA", 
        "postalCode": "94043",
        "country": "USA"
    },
    "paymentInfo": {
        "card": "4242 4242 4242 4242",
        "cvv": "314",
        "exp_month": 5,
        "exp_year": 2024,
        "name": "Customer One"
    }
}
You can also use frontend file called checkout.html
------------
purchaseHisotry.js
------------
This is a way for a user to retireve all the purcahses
Usage:
Method: GET
Endpoint: http://localhost:3000/retrieve-purchase-history/662fd390bbe6d16f3f91f21b

You can also use frontend file called purchaseHisotry.html

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

