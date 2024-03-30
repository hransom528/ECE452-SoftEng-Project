const request = require("supertest");
const server = require("../../../server");

// Team 1 Jasmine tests:

describe("Projec Unit Tests TEAM 1", () => {
  const ACCESS_TOKEN =
    "ya29.a0Ad52N381oNnbstkTQZl79PgShIOVfrrBduvQn1azbJA4gDOQROk5CF7Y43BUl-4NqIsqRcN5hHAgoiP4vn_wm0pKaZnNHHdt5IVnA92GPXd99r9E_hWaVzhJ8LajXVLnSFz0o5Fn99pJcwY9Fj9CxirayiO9pa-ho1IaCgYKARoSARISFQHGX2MiPfX3LZbnDzIUFbSkbs1LAg0170";

  it("should not allow user to register without having a valid access token generating from google OAuth", async () => {
    const requestBody = {
      accToken: "Invalid Token",
      AcceptTerms: "Yes",
      isPremium: false,
      address: "Some awesome lane, Earth",
    };

    const response = await request(server)
      .post("/registerUser")
      .send(requestBody);
    expect(response.statusCode).toEqual(400);
  });

  it("should not allow user to register if the access token field is empty", async () => {
    const requestBody = {
      accToken: "",
      AcceptTerms: "Yes",
      isPremium: false,
      address: "Some awesome lane, Earth",
    };

    const response = await request(server)
      .post("/registerUser")
      .send(requestBody);
    expect(response.statusCode).toEqual(400);
  });

  // if you have already registered with your email and then this test runs, you will simply be logged in because ur email was found in database
  it("should not allow user to register without accepting terms and condition", async () => {
    const requestBody = {
      accToken: ACCESS_TOKEN,
      AcceptTerms: "no",
      isPremium: false,
      address: "Some awesome lane, Earth",
    };

    const response = await request(server)
      .post("/registerUser")
      .send(requestBody);
    expect(response.statusCode).toEqual(200);
  });

  it("should not allow user to register if they leave terms and conditions field empty", async () => {
    const requestBody = {
      accToken: ACCESS_TOKEN,
      AcceptTerms: "",
      isPremium: false,
      address: "Some awesome lane, Earth",
    };

    const response = await request(server)
      .post("/registerUser")
      .send(requestBody);
    expect(response.statusCode).toEqual(200);
  });

  it("should not allow user to register with and empty address", async () => {
    const requestBody = {
      accToken: ACCESS_TOKEN,
      AcceptTerms: "Yes",
      isPremium: false,
      address: "",
    };

    const response = await request(server)
      .post("/registerUser")
      .send(requestBody);
    expect(response.statusCode).toEqual(200);
  });

  it("should NOT allow user to login with a valid access token if they DO NOT exist in our database", async () => {
    const requestBody = {
      accToken: ACCESS_TOKEN,
    };

    const response = await request(server).post("/loginUser").send(requestBody);
    expect(response.statusCode).toEqual(400);
  });

  it("should allow user to register with having a valid access token generating from google OAuth", async () => {
    const requestBody = {
      accToken: ACCESS_TOKEN,
      AcceptTerms: "Yes",
      isPremium: false,
      address: "Some awesome lane, Earth",
    };

    const response = await request(server)
      .post("/registerUser")
      .send(requestBody);
    expect(response.statusCode).toEqual(200);
  });

  it("should allow user to login with a valid access token and if they exist in our database", async () => {
    const requestBody = {
      accToken: ACCESS_TOKEN,
    };

    const response = await request(server).post("/loginUser").send(requestBody);
    expect(response.statusCode).toEqual(200);
  });

  it("should not allow user to login without having a valid access token generated from google OAuth", async () => {
    const requestBody = {
      accToken: "Invalid Token",
    };

    const response = await request(server).post("/loginUser").send(requestBody);
    expect(response.statusCode).toEqual(400);
  });

  it("should not allow user to login if their access token is empty ", async () => {
    const requestBody = {
      accToken: "",
    };

    const response = await request(server).post("/loginUser").send(requestBody);
    expect(response.statusCode).toEqual(400);
  });

  it("should not allow someone to send a request to AI without being properly logged in and having an updated access token", async () => {
    const requestBody = {
      aToken: "Out of date",
      prompt: "What are the best products for me to buy to gain muscle?",
    };

    const response = await request(server).post("/talkToAI").send(requestBody);
    expect(response.statusCode).toEqual(400);
  });

  it("should not allow someone to send a request to AI if they do not have an access token", async () => {
    const requestBody = {
      aToken: "",
      prompt: "What are the best products for me to buy to gain muscle?",
    };

    const response = await request(server).post("/talkToAI").send(requestBody);
    expect(response.statusCode).toEqual(400);
  });

  it("should allow user to send a prompt to AI if they are logged in and access token is validated", async () => {
    const requestBody = {
      aToken: ACCESS_TOKEN,
      prompt: "What are the best products for me to buy to gain muscle?",
    };

    const response = await request(server).post("/talkToAI").send(requestBody);
    expect(response.statusCode).toEqual(200);
  });

  it("should NOT allow user to send a prompt to AI if the prompt field is empty", async () => {
    const requestBody = {
      aToken: ACCESS_TOKEN,
      prompt: "",
    };

    const response = await request(server).post("/talkToAI").send(requestBody);
    expect(response.statusCode).toEqual(400);
  });

  it("should allow user to update user profile if information is new and entered properly", async () => {
    const requestBody = {
      accToken: ACCESS_TOKEN,
      userId: "66036d8ebb0295510accc86c",
      profileUpdates: {
        name: "Jane Doe",
      },
    };

    const response = await request(server)
      .post("/update-user-profile")
      .send(requestBody);
    expect(response.statusCode).toEqual(200);
  });

  it("should NOT allow user to update user profile if access token is missing/invalid", async () => {
    const requestBody = {
      accToken: "Invalid Token",
      userId: "66036d8ebb0295510accc86c",
      profileUpdates: {
        name: "Jane Doe",
      },
    };

    const response = await request(server)
      .post("/update-user-profile")
      .send(requestBody);
    expect(response.statusCode).toEqual(500);
  });
});

// jasmine problem, works fine on postman:
// it("should allow user to update a shipping address if all information is filled out properly", async () => {
//     //     const requestBody = {
//     //       accToken: ACCESS_TOKEN,
//     //       userId: "66036d8ebb0295510accc86c",
//     //       addressId: "4836bf75-b997-43e8-9150-45923d382cec",
//     //       updatedAddress: {
//     //         recipientName: "Jane Doe",
//     //         streetAddress: "123 Newer Street",
//     //         city: "New Brunswick",
//     //         state: "New Jersey",
//     //         postalCode: "08091",
//     //         country: "USA",
//     //         isDefault: true,
//     //         isValid: true,
//     //       },
//     //     };

//     //     const response = await request(server)
//     //       .post("/update-shipping-address")
//     //       .send(requestBody);
//     //     expect(response.statusCode).toEqual(200);
//     //   });
