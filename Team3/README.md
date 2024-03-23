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