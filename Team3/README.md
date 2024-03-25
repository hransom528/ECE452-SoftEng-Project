This is readme for team 3


For testing of update listings , run the server first and then go to POSTMAN 
and for the URL:
URL :http://localhost:3000/update-listings
Body -> Raw ->JSON
Then input : 
{
  "productIds": [
    "65f8ece88c06f461ae617086"
  ],
  "updateFields": {
    "name": "Fitness Gear Pro GHD Bench",
    "description": "This is a bench",
    "brand": "Dicks",
    "type": "bench workout",
    "price": 149.99,
    "stockQuantity": 15,
    "trendingScore": 4.6,
    "topTrending": true,
    "rating": 4.9,
    "specs": {
      "weight": "150 lbs",
      "color": "Black",
      "material": "carbon steel"
    },
    "images": [
      "https://dks.scene7.com/is/image/GolfGalaxy/16FGEUPRGHDBNCHXXWGH?wid=2000&fmt=pjpeg",
      "https://dks.scene7.com/is/image/GolfGalaxy/STE00407_NOCOLOR_DET-alt1?wid=2000&fmt=pjpeg"
    ]
  },
  "unsetFields": [
    "quantity"
  ]
}

THEN YOU WOULD BE ABLE TO SEE THIS FOR THE PRODUCT DETAILS WITH THIS PRODUCT ID.
You can test the  update listings for any other product id as well.



FOR CREATING STRIPE CUSTOMER ID BASED IN THE USER OBJECT ID , NAME, EMAIL
URL : http://localhost:3000/create-stripe-customer
Body -> Raw ->JSON
Then input :
{
    "userObjectId": "65ff5d3958f0bd6b97154de5",
    "email": "firstcustomertest@gmail.com",
    "name": "Customer One"
}

THEN YOU WOULD BE ABLE TO SEE THE STRIPE CUSTOMER IF ITS THE NEW USER OR IF ITS THE PREVIOUS USER , THEN YOU WOULD SEE USER ALREADY EXISTS . ALSO AFTER SEDNING THIS REQUEST GO TO STRIPE DASHBOARD AND THEN SEE FOR THE CUSTOMER THAT'S NEWLY CREATED OR THE EXISITNG ONE .


FOR CREATING THE PAYMENT METHOD ID BASED ON THE STRIPE CUSTOMER ID , USER OBJECT ID , AND WE ARE USING STRIPE TOKENS AND ALSO BASED ON THIS :
URL : http://localhost:3000/verify-card-details
Body -> Raw ->JSON
Then input :
{
    "userObjectId": "65fb25498ee7dfe76e161b71",
    "stripeCustomerId": "cus_PnYZsY9ebP27KL",
    "stripeToken": "tok_visa"
}

AFTER SENDING THIS REQUEST YOU OWULD THEN BE ABLE TO SEE THE PAYMENT METHOD ID THAT'S GENERATED AND YOU CAN OPEN THE STRIPE DASHBOARD TO LOOK FOR THAT CUSTOMER WITH THIS GENERATED PAYMENT METHOD ID 


URL: http://localhost:3000/delete-listings
Body -> Raw ->JSON
Then input :
{
    {
    "productIds": ["6601be3dd1acda9f810deded"]
}

}
