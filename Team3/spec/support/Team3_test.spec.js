const request = require("supertest");
const server = require("../../server.js");
const { connectDBandClose } = require('../../dbConfig');
const { fetchTopRatedProducts, fetchTopRatedProductsByBrand, fetchTopRatedProductsByType } = require("./Team3/UC9_Product_Performace_Insight.js");
const { updateListings, deleteListings } = require('./Team3/UC8update_listings.js'); // Replace with the correct path

// team 3 jasmine tests:

describe('Project Unit Tests Team 3', () => {
  let db, client;
  
  beforeEach(async () => {
    const connection = await connectDBandClose();
    db = connection.db;
    client = connection.client;

    // Insert a test user
    await db.collection('users').insertOne({
      _id: new ObjectId("507f1f77bcf86cd799439011"), // Example ObjectId
      email: "testuser@example.com",
      name: "Test User",
      stripeCustomerId: ""
    });
  });

  afterEach(async () => {
    // Delete the test user
    await db.collection('users').deleteMany({
      email: "testuser@example.com"
    });

    await client.close();
  });

  it('should create a Stripe customer', async () => {
    const requestBody = {
      userObjectId: "507f1f77bcf86cd799439011",
      email: "testuser@example.com",
      name: "Test User"
    };

    const response = await request(server)
      .get("/create-stripe-customer")
      .send(requestBody);

    expect(response.statusCode).toEqual(200);
    expect(response.body.success).toEqual(true);

    const customer = await db.collection('users').findOne({
      _id: new ObjectId("507f1f77bcf86cd799439011")
    });
    expect(customer.stripeCustomerId).not.toBeNull();
  });
  it('should verify card details', async () => {
    // First, ensure the test user has a Stripe customer ID set in the database
    const stripeCustomerId = "cus_testExampleCustomerId"; // Example Stripe customer ID
    await db.collection('users').updateOne({ _id: new ObjectId("507f1f77bcf86cd799439011") }, { $set: { stripeCustomerId: stripeCustomerId } });
    const requestBody = {
      userObjectId: "507f1f77bcf86cd799439011", // This matches the user's _id in the database
      stripeToken: "tok_visa", // Example Stripe token for testing
      stripeCustomerId: "cus_testExampleCustomerId"
    };

    const verifyResponse = await request(server)
      .post("/verify-card-details")
      .send(requestBody);
  
    // Check if the response indicates success
    expect(verifyResponse.statusCode).toEqual(200);
    expect(verifyResponse.body.success).toEqual(true);
  
    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId("507f1f77bcf86cd799439011") });
    expect(updatedUser.stripeCustomerId).toBeTruthy(); // Ensure the stripeCustomerId is still set
  });
  
  it('should process payment', async () => {
   
    const stripeCustomerId = "cus_testExample"; 
    await db.collection('users').updateOne({ _id: testUserId }, { $set: { stripeCustomerId: stripeCustomerId } });

    const paymentRequestBody = {
      userObjectId: testUserId.toHexString(), 
      stripeCustomerId: stripeCustomerId,
      amountInDollars: 100
    };

    const paymentResponse = await request(server)
      .post("/process-payment")
      .send(paymentRequestBody);

    expect(paymentResponse.statusCode).toEqual(200);
    expect(paymentResponse.body.message).toEqual("Payment processed successfully");
  });
});

describe('Product Performance Insights', () => {
  let db, client;

  beforeEach(async () => {
      const connection = await connectDBandClose();
      db = connection.db;
      client = connection.client;

      // Insert some test products
      await db.collection('products').insertMany([
          { name: 'Product A', brand: 'BrandX', type: 'Type1', rating: 5 },
          { name: 'Product B', brand: 'BrandX', type: 'Type2', rating: 4 },
          // Add more products as needed for testing
      ]);
  });

  afterEach(async () => {
      // Delete the test products
      await db.collection('products').deleteMany({});
      await client.close();
  });

  it('should fetch top rated products', async () => {
      const topRatedProducts = await fetchTopRatedProducts();
      expect(topRatedProducts.length).toEqual(10);
      // Add more assertions as needed
  });

  it('should fetch top rated products by brand', async () => {
      const brand = 'BrandX';
      const topRatedProductsByBrand = await fetchTopRatedProductsByBrand(brand);
      expect(topRatedProductsByBrand.length).toEqual(5);
      // Check if the products are from the correct brand
  });

  it('should fetch top rated products by type', async () => {
      const type = 'Type1';
      const topRatedProductsByType = await fetchTopRatedProductsByType(type);
      expect(topRatedProductsByType.length).toEqual(5);
      // Check if the products are of the correct type
  });

  it('should handle fetching when there are fewer products than requested', async () => {
    const brand = 'BrandX';
    // Assuming we want to fetch more products than are available
    const limit = 100; 
    const topRatedProducts = await fetchTopRatedProductsByBrand(brand, limit);
    // The actual number of fetched products should not exceed the total number of products available
    expect(topRatedProducts.length).toBeLessThanOrEqual(limit);
  });

  it('should correctly sort products by rating', async () => {
    const topRatedProducts = await fetchTopRatedProducts();
    let isSorted = true;
    for (let i = 0; i < topRatedProducts.length - 1; i++) {
        if (topRatedProducts[i].rating < topRatedProducts[i + 1].rating) {
            isSorted = false;
            break;
        }
    }
    expect(isSorted).toBe(true);
  });
});

describe('Listings Management', () => {
  let db, client, productsCollection;

  beforeEach(async () => {
      const connection = await connectDBandClose();
      db = connection.db;
      client = connection.client;
      productsCollection = db.collection('products');

      // Insert some test products for update and delete operations
      await productsCollection.insertMany([
          { name: 'Product C', type: 'Type3', price: 20 },
          { name: 'Product D', type: 'Type4', price: 30 }
      ]);
  });

  afterEach(async () => {
      await productsCollection.deleteMany({});
      await client.close();
  });

  it('should update listings correctly', async () => {
      const productsToUpdate = await productsCollection.find({}).toArray();
      const productIds = productsToUpdate.map(product => product._id.toString());
      const updateFields = { price: 25 };

      const results = await updateListings(productIds, updateFields);
      expect(results.length).toBe(productsToUpdate.length);

      // Verify the update operation was successful
      const updatedProducts = await productsCollection.find({}).toArray();
      updatedProducts.forEach(product => {
          expect(product.price).toBe(25);
      });
  });

  it('should delete listings correctly', async () => {
      const productsToDelete = await productsCollection.find({}).toArray();
      const productIds = productsToDelete.map(product => product._id.toString());

      const results = await deleteListings(productIds);
      expect(results.length).toBe(productsToDelete.length);

      // Verify the delete operation was successful
      const remainingProducts = await productsCollection.find({}).toArray();
      expect(remainingProducts.length).toBe(0);
  });

  // New test cases
  it('should partially update listings correctly', async () => {
      const productsToUpdate = await productsCollection.find({}).toArray();
      const productIds = productsToUpdate.map(product => product._id.toString());
      const updateFields = { price: 55 };

      const results = await updateListings(productIds, updateFields);
      expect(results.length).toBe(productsToUpdate.length);

      // Verify only the specified fields were updated
      const updatedProducts = await productsCollection.find({}).toArray();
      updatedProducts.forEach(product => {
          expect(product.price).toBe(55);
      });
  });

  it('should remove fields from listings correctly', async () => {
      const productsToUpdate = await productsCollection.find({}).toArray();
      const productIds = productsToUpdate.map(product => product._id.toString());
      const removeFields = ['type'];

      const results = await updateListings(productIds, {}, removeFields);
      expect(results.length).toBe(productsToUpdate.length);

      // Verify the fields were removed
      const updatedProducts = await productsCollection.find({}).toArray();
      updatedProducts.forEach(product => {
          expect(product.type).toBeUndefined();
      });
  });

  it('should handle update with invalid product IDs', async () => {
      const productIds = ['invalidId'];
      const updateFields = { price: 65 };

      await expectAsync(updateListings(productIds, updateFields)).toBeRejected();
  });

  it('should handle deletion with invalid product IDs', async () => {
      const productIds = ['invalidId'];

      await expectAsync(deleteListings(productIds)).toBeRejected();
  });
});
