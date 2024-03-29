const request = require("supertest");
const server = require("../../server.js");
const { connectDBandClose } = require('../../dbConfig');
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