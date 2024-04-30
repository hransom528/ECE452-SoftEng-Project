require("dotenv").config();
const {checkoutCart} = require("./Team2/checkoutV2");
const {getPurchaseHistoryByUserId} = require("./Team2/purchaseHistory.js");


const { ObjectId } = require("mongodb");
const http = require("http");
const url = require("url");

const { StringDecoder } = require("string_decoder");
const {
  createStripeCustomerAndUpdateDB,
  verifyCardAndUpdateDB,
  createPaymentAndProcessing,
  refundPayment,
} = require("./Team3/stripe.js");
const {
  verifyAddress,
  checkAddressCompleteness,
  retrieveAddressHistory
} = require('./Team2/AddressValidationAPI.js');
const { updateListings } = require("./Team3/UC8update_listings.js");
const { deleteListings } = require("./Team3/UC8update_listings.js");
const { addProduct } = require("./Team3/UCCreateProduct.js");
const { updateDiscount } = require("./Team3/UC10DiscountManagement.js");
const { discountByType } = require("./Team3/UC10DiscountManagement.js");
const { discountByBrand } = require("./Team3/UC10DiscountManagement.js");
const {
  fetchTopRatedProducts,
} = require("./Team3/UC9_Product_Performace_Insight.js");
const {
  fetchTopRatedProductsByBrand,
} = require("./Team3/UC9_Product_Performace_Insight.js");
const {
  fetchTopRatedProductsByType,
} = require("./Team3/UC9_Product_Performace_Insight.js");

const {
  addToCart,
  removeFromCart,
  getCart,
} = require("./Team2/Cart.js");

const {
  updateUserProfile,
  updateUserName,
  addUserShippingAddress,
  updateUserShippingAddress,
  deleteUserShippingAddress,
  deleteUserProfile,
} = require("./Team1/UserProfile/userProfile");
const {
  purchasePremiumMembership,
  cancelPremiumMembership,
} = require("./Team1/UserProfile/membershipManagement.js");
const { registerUser, loginUser } = require("./Team1/Reg_lgn/regLogin");
const {
  getAccessTokenFromCode,
  getUserInfo,
} = require("./Team1/Reg_lgn/oAuthHandler");
const { getResponseFromOpenAI } = require("./Team1/ChatBot/openAi");
const {
  getProductById,
  hasPurchasedProduct,
  reviewProduct
} = require("./Team4/Product_Review.js");
const productFilterQuery = require("./Team4/Filter_Search.js");
const { addToWatchlist, removeFromWatchlist, getWatchlist, getProduct, getUser } = require("./Team2/Watchlist.js");
const { autocompleteProductSearch } = require("./Team4/autocomplete.js");
const { productSearchQuery } = require("./Team4/Product_Search.js");

let responseSent = false;
let result;

const server = http.createServer(async (req, res) => {

  //add frontent capability
  //Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS pre-flight request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");

  const decoder = new StringDecoder("utf-8");
  let buffer = "";

  // Log HTTP method, request URL, and headers
  // console.log(`HTTP Method: ${req.method}`);
  // console.log(`Request URL: ${req.url}`);
  // console.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
  // // Assuming the buffer contains the full request body
  // console.log(`Request Body: ${buffer}`);

  req.on("data", (data) => {
    buffer += decoder.write(data);
  });

  req.on("end", async () => {
    buffer += decoder.end();
    // console.log(`Request Body: ${buffer}`);

    // Wrap res.write and res.end to capture and log response details
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);
    let responseBody = "";

    res.write = (chunk, ...args) => {
      responseBody += chunk;
      originalWrite(chunk, ...args);
    };

    res.end = (chunk, ...args) => {
      if (chunk) responseBody += chunk;
      // Log the response just before sending it
      // console.log(`Response Status: ${res.statusCode}`);
      // console.log(`Response Headers: ${JSON.stringify(res.getHeaders())}`);
      // console.log(`Response Body: ${responseBody}`);

      originalEnd(chunk, ...args);
    };

    // ACCESS TOKEN
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.split(' ')[1]; // Assumes Bearer token

    let userInfo;

    try {
      if (req.method === "PATCH") {
        const requestBody = JSON.parse(buffer);
        let result = null;

        switch (trimmedPath) {
          case "update-name":
            userInfo = await getUserInfo(token);
            if (!token) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Access Token is required" }));
              responseSent = true;
              return;
            }

            result = await updateUserName(requestBody);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                message: "Name successfully updated",
                data: result,
              })
            );
            break;
          case "update-shipping-address":
            userInfo = await getUserInfo(token);
            if (!token) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Access Token is required" }));
              responseSent = true;
              return;
            }

            result = await updateUserShippingAddress(requestBody);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                message: "Shipping Address successfully updated",
                data: result,
              })
            );
            break;
          // ...other PATCH routes
          default:
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Not Found" }));
            return; // Early return to prevent further execution
        }
      } else if (req.method === "PUT") {
        const requestBody = JSON.parse(buffer);
        let result = null;

        switch (trimmedPath) {
          case "update-user-profile":
            userInfo = await getUserInfo(token);
            if (!token) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Access Token is required" }));
              responseSent = true;
              return;
            }

            result = await updateUserProfile(requestBody);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                message: "User Profile successfully updated",
                data: result,
              })
            );
            break;
          // ...other PUT routes
          default:
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Not Found" }));
            return; // Early return to prevent further execution
        }
      } else if (req.method === "DELETE") {
        const requestBody = JSON.parse(buffer);
        let result = null;

        switch (trimmedPath) {
          case "delete-shipping-address":
            userInfo = await getUserInfo(token);
            if (!token) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Access Token is required" }));
              responseSent = true;
              return;
            }

            result = await deleteUserShippingAddress(requestBody);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                message: "Shipping address deleted successfully",
                data: result,
              })
            );
            break;
          case "delete-listings":
            console.log(
              "Received productIds for deletion:",
              requestBody.productIds
            );
            if (
              !Array.isArray(requestBody.productIds) ||
              requestBody.productIds.some((id) => !ObjectId.isValid(id))
            ) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Invalid input for deleting listings",
                })
              );
              return;
            }
            try {
              const result = await deleteListings(requestBody.productIds);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Listings deleted successfully",
                  result,
                })
              );
            } catch (error) {
              console.error(
                "An error occurred during the deletion operation:",
                error
              );
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Internal server error" }));
            }
            return;
          case "delete-user-profile":
            userInfo = await getUserInfo(token);
            if (!token) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Access Token is required" }));
              responseSent = true;
              return;
            }

            result = await deleteUserProfile(requestBody);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                message: "User profile deleted successfully",
                data: result,
              })
            );
            break;
          // ...other DELETE routes
          default:
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Not Found" }));
            return; // Early return to prevent further execution
        }
      } else if (req.method === "POST") {
        const requestBody = JSON.parse(buffer);
        let result = null;

        switch (trimmedPath) {
          case 'verify-address':
            const add = requestBody.address;
            result = await verifyAddress(add);
            break;

          case 'check-address-completeness':
            result = await checkAddressCompleteness(requestBody);
            break;

          case 'add-to-watchlist':
            try {
              // Call the addToWatchlist function, passing the access token from request headers
              const result = await addToWatchlist(token, requestBody.productName);

              // Handle the result and send appropriate response
              if (result.error) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: result.error }));
                return;
              }
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: result.message }));
              return;
            } catch (error) {
              console.error("Error adding product to watchlist:", error);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Internal Server Error" }));
              return;
            }

          case 'remove-from-watchlist':
            try {
              const result = await removeFromWatchlist(token, requestBody.productName);
              if (result.error) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: result.error }));
                return;
              }

              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Product removed from watchlist" }));
            } catch (error) {
              console.error("Error removing product from watchlist:", error);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Internal Server Error" }));
            }
            return;





          case "checkout":
            // const { userId, cartId, address, paymentToken, stripeCustomerId } =
            //   requestBody;
            // await checkout(
            //   userId,
            //   cartId,
            //   address,
            //   paymentToken,
            //   stripeCustomerId
            // );
            // result = { message: "Checkout successful" };
            const { userId, billingAddr, shippingAddr, paymentInfo } = requestBody;
            const addr1 = requestBody.billingAddr;
            const addr2 = requestBody.shippingAddr;
            checkoutCart(userId, billingAddr, shippingAddr, paymentInfo)
              .then(checkoutDetails => {
                console.log('Checkout Successful:', checkoutDetails);
              })
              .catch(error => {
                console.error('Checkout Failed:', error.message);
              });



            break;

          case "verify-card-details":
            try {
              const { userObjectId, stripeCustomerId, stripeToken } = requestBody;
              const verifyResult = await verifyCardAndUpdateDB(
                userObjectId,
                stripeCustomerId,
                stripeToken
              );
              const statusCode = verifyResult.success ? 200 : 400; // Use 400 for client-side error
              res.writeHead(statusCode, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: verifyResult.success, data: verifyResult }));
            } catch (error) {
              console.error("Error verifying card details:", error);
              if (!res.headersSent) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    success: false,
                    message: "Failed to verify card details",
                    error: error.message,
                  })
                );
              }
            }
            return;
          case "add-bank-account":
            try {
              const { stripeCustomerId, accountNumber, routingNumber, accountHolderName, accountHolderType } = requestBody;

              const result = await addBankTransferAccount(
                stripeCustomerId,
                accountNumber,
                routingNumber,
                accountHolderName,
                accountHolderType
              );

              if (result.success) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                  message: "Bank account added successfully.",
                  bankAccountId: result.bankAccountId
                }));
              } else {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                  message: "Failed to add bank account.",
                  error: result.message
                }));
              }
            } catch (error) {
              console.error("Error adding bank account:", error);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                message: "Internal server error while adding bank account.",
                error: error.message
              }));
            }
            break;
          case "process-payment":
            try {
              const { stripeCustomerId, id, amount, currency, idType } = requestBody;
              const finalCurrency = currency || 'usd'; // Default to 'USD' if currency is not provided

              const paymentResult = await createPaymentAndProcessing(
                stripeCustomerId,
                id,
                amount,
                finalCurrency,
                idType // This new parameter should be either 'payment_method' or 'bank_account'
              );

              if (paymentResult.success) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    message: "Payment processed successfully",
                    data: paymentResult,
                  })
                );
              } else {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    message: paymentResult.message,
                    data: paymentResult,
                  })
                );
              }
            } catch (error) {
              console.error("Error processing payment:", error);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Failed to process payment",
                  error: error.message,
                })
              );
            }
            break;
          case "refund-payment":
            try {
              const { stripeCustomerId, paymentIntentId, reason } = requestBody;

              // Call your refund function
              const refundResult = await refundPayment(stripeCustomerId, paymentIntentId, reason);

              // Determine the status code based on the operation result
              const statusCode = refundResult.success ? 200 : 400; // Use 400 for client error

              // Write the appropriate headers and response
              res.writeHead(statusCode, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: refundResult.success, data: refundResult }));
            } catch (error) {
              console.error("Error processing refund:", error);
              if (!res.headersSent) {
                // Write the headers for an internal server error
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    success: false,
                    message: "Failed to process refund",
                    error: error.message,
                  })
                );
              }
            }
            return;

          // userProfile.js
          case "update-user-profile":
            userInfo = await getUserInfo(token);
            if (!token) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Access Token is required" }));
              responseSent = true;
              return;
            }

            try {
              // Directly passing requestBody to updateUserProfile
              const result = await updateUserProfile(requestBody);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "User profile updated successfully",
                  data: result,
                })
              );
              responseSent = true;
            } catch (error) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Error updating user profile",
                  error: error.toString(),
                })
              );
              responseSent = true;
            }
            break;
          case "add-shipping-address":
            userInfo = await getUserInfo(token);
            if (!token) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Access Token is required" }));
              responseSent = true;
              return;
            }

            result = await addUserShippingAddress(requestBody);
            break;

          case "update-listings":
            // Validate request body structure and content
            if (!Array.isArray(requestBody.productIds) || requestBody.productIds.length === 0) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Product IDs must be a non-empty array." }));
              responseSent = true;
              return;
            }
            if (typeof requestBody.updateFields !== "object" || Object.keys(requestBody.updateFields).length === 0) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Update fields must be a non-empty object." }));
              responseSent = true;
              return;
            }
            if (requestBody.productIds.some(id => !ObjectId.isValid(id))) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "One or more product IDs are invalid." }));
              responseSent = true;
              return;
            }
            if (requestBody.unsetFields && !Array.isArray(requestBody.unsetFields)) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Unset fields must be an array if provided." }));
              responseSent = true;
              return;
            }
            try {
              const result = await updateListings(
                requestBody.productIds,
                requestBody.updateFields,
                requestBody.unsetFields || []
              );
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Listings updated successfully.", result: result }));
            } catch (error) {
              console.error("Error updating listings:", error);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Internal server error while updating listings." }));
            }
            break;

          case "add-to-cart":
            if (
              !ObjectId.isValid(requestBody.userId) ||
              !ObjectId.isValid(requestBody.productId) ||
              typeof requestBody.quantity !== "number" ||
              requestBody.quantity < 1
            ) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({ message: "Invalid input for adding to cart" })
              );
              return; // Exit the function here to prevent further execution
            }

            // Call addToCart function
            result = await addToCart(
              requestBody.userId,
              requestBody.productId,
              requestBody.quantity
            );
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(result)); // Send back the updated cart
            return; // Make sure to return here to stop further execution and prevent additional responses

          case "remove-from-cart":
            if (
              !ObjectId.isValid(requestBody.userId) ||
              !ObjectId.isValid(requestBody.productId) ||
              typeof requestBody.quantityToRemove !== "number" ||
              requestBody.quantityToRemove < 1
            ) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Invalid input for removing from cart",
                })
              );
              return; // Exit this case block, ensuring no further code in this case is executed
            }

            // Assuming removeFromCart function is defined and properly handles the logic
            try {
              const result = await removeFromCart(
                requestBody.userId,
                requestBody.productId,
                requestBody.quantityToRemove
              );
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify(result)); // Send back the updated cart
            } catch (error) {
              console.error("Error removing item from cart:", error);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Error handling request",
                  error: error.toString(),
                })
              );
            }
            return;

          //break here

          case "update-discount":
            // Make sure requestBody has the necessary fields
            if (
              !requestBody._id ||
              typeof requestBody.discountPercentage === "undefined"
            ) {
              throw new Error("Both _id and discountPercentage are required");
            }
            result = await updateDiscount(
              requestBody._id,
              requestBody.discountPercentage
            );
            break;
          case "discount-by-brand":
            if (
              !requestBody.brand ||
              typeof requestBody.discountPercentage === "undefined"
            ) {
              throw new Error("Both brand and discountPercentage are required");
            }
            result = await discountByBrand(
              requestBody.brand,
              requestBody.discountPercentage
            );
            break;

          case "discount-by-type":
            if (
              !requestBody.type ||
              typeof requestBody.discountPercentage === "undefined"
            ) {
              throw new Error("Both type and discountPercentage are required");
            }
            result = await discountByType(
              requestBody.type,
              requestBody.discountPercentage
            );
            break;

          case "add-product":
            result = await addProduct(requestBody);
            break;

          case "registerUser":
            // const accessToken = requestBody.accessToken; // part of post request JSON
            // const authHeader3 = req.headers['authorization'] || '';
            // const token3 = authHeader3.split(' ')[1]; // Assumes Bearer token
            if (!token) {
              throw new Error("Not able to authorize"); // maybe give res writehead here
            }
            try {
              // exchanging code for for access Token
              // const accessToken = await getAccessTokenFromCode(authCode);

              // use access token to get user's info from google account
              userInfo = await getUserInfo(token);

              //use the info we got to finish registering the user
              result = await registerUser(userInfo, requestBody);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: result,
                })
              );
              responseSent = true;
            } catch (oauthError) {
              // handling auth errors
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "OAuth Error",
                  error: oauthError.message,
                })
              );
              responseSent = true;
              return;
            }
            break;

          case "loginUser":
            // const accToken = requestBody.accToken; // part of post request JSON
            // const authHeader2 = req.headers['authorization'] || '';
            // const token2 = authHeader2.split(' ')[1]; // Assumes Bearer token
            if (!token) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Access Token is required" }));
              responseSent = true;
              return;
            }
            try {
              // Use access token to get user's info from Google account
              userInfo = await getUserInfo(token);

              // Use the info we got to log the user in
              result = await loginUser(userInfo, requestBody);
              // Assuming loginUser will throw an error if login is unsuccessful

              // You can customize the response as needed, perhaps to include a session token
              // or a message indicating successful login
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Login successful",
                  // If your loginUser method returns useful data, include it here
                  // For example: user: result.user, token: result.token, etc.
                })
              );
              responseSent = true;
            } catch (loginError) {
              // handling login errors
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Login Error",
                  error: loginError.message,
                })
              );
              responseSent = true;
              return;
            }
            break;

          case "talkToAI":
            // const token = requestBody.aToken; // part of post request JSON
            // const authHeader = req.headers['authorization'] || '';
            // const token = authHeader.split(' ')[1]; // Assumes Bearer token
            userInfo = await getUserInfo(token);
            if (!token) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Access Token is required" }));
              responseSent = true;
              return;
            }

            // Ensure body contains 'prompt'
            if (!requestBody.prompt) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Prompt is required" }));
              responseSent = true;
              break;
            }

            try {
              await getResponseFromOpenAI(requestBody) // implement userInfo on ai function side
                .then((response) => {
                  // console.log("AI Response:", response);
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      message: "Operation successful",
                      data: response,
                    })
                  );
                  responseSent = true;
                })
                .catch((error) => {
                  console.log("Error interacting with AI:", error); // Debugging line
                  res.writeHead(500, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      message: "Error interacting with AI",
                      error: error.toString(),
                    })
                  );
                  responseSent = true;
                });
            } catch (Error) {
              // handling login errors
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Not able to send prompt to AI", // implement better
                  error: Error.message,
                })
              );
              responseSent = true;
              return;
            }

            break;

          // membershipManagement.js
          case "purchase-premium-membership":
            if (!token) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Access Token is required" }));
              responseSent = true;
              return;
            }

            userInfo = await getUserInfo(token);

            if (
              !requestBody.userId ||
              !requestBody.stripeCustomerId ||
              !requestBody.stripeToken
            ) {
              throw new Error(
                "Missing required parameters for purchasing premium membership"
              );
            }
            result = await purchasePremiumMembership(requestBody);
            break;
          case "cancel-premium-membership":
            if (!token) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Access Token is required" }));
              responseSent = true;
              return;
            }
            userInfo = await getUserInfo(token);

            if (!requestBody.userId) {
              throw new Error(
                "Missing userId for cancelling premium membership"
              );
            }
            result = await cancelPremiumMembership(requestBody.userId);
            break;

          // contact.htmlf
          case "send-email":
            // Forward the request to the web3forms API
            // need to implement token here

            userInfo = await getUserInfo(token);
            if (!token) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Access Token is required" }));
              responseSent = true;
              return;
            }

            fetch("https://api.web3forms.com/submit", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: buffer, // buffer contains the JSON string from the client
            })
              .then((response) => response.json())
              .then((data) => {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    message: "Email sent successfully",
                    data: data,
                  })
                );
              })
              .catch((error) => {
                console.error("Error sending email:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    message: "Failed to send email",
                    error: error.toString(),
                  })
                );
              });
            return;
          case "update-listings":
            console.log(
              "Received productIds for update:",
              requestBody.productIds
            );
            console.log("Received update fields:", requestBody.updateFields);
            console.log("Received fields to remove:", requestBody.unsetFields); // Log the fields to remove

            if (
              !Array.isArray(requestBody.productIds) ||
              typeof requestBody.updateFields !== "object" ||
              requestBody.productIds.some((id) => !ObjectId.isValid(id)) ||
              (requestBody.unsetFields &&
                !Array.isArray(requestBody.unsetFields))
            ) {
              // Check if unsetFields is an array if it exists
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Invalid input for updating listings",
                })
              );
              return;
            }
            result = await updateListings(
              requestBody.productIds,
              requestBody.updateFields,
              requestBody.unsetFields
            );
            break;

          case "update-discount":
            if (!requestBody._id || !requestBody.discountPercentage) {
              throw new Error("Both _id and discountPercentage are required");
            }
            result = await updateDiscount(
              requestBody._id,
              requestBody.discountPercentage
            );
            break;
          default:
            throw new Error("Route not found");

          case "fetch-top-rated-products-by-brand":
            if (!requestBody.brand) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Brand is required" }));
              return;
            }
            try {
              const brandResults = await fetchTopRatedProductsByBrand(
                requestBody.brand
              );
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Top rated products by brand fetched successfully",
                  data: brandResults,
                })
              );
            } catch (error) {
              console.error(
                "Error fetching top rated products by brand:",
                error
              );
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Error fetching products by brand",
                  error: error.toString(),
                })
              );
            }
            break;

          case "fetch-top-rated-products-by-type":
            if (!requestBody.type) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Type is required" }));
              return;
            }
            try {
              const typeResults = await fetchTopRatedProductsByType(
                requestBody.type
              );
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Top rated products by type fetched successfully",
                  data: typeResults,
                })
              );
            } catch (error) {
              console.error(
                "Error fetching top rated products by type:",
                error
              );
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Error fetching products by type",
                  error: error.toString(),
                })
              );
            }
            break;

            case "filterCatalog":
            result = await productFilterQuery(requestBody);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                message: "Products filtered succesfully",
                data: result,
              })
            );
            responseSent=true;
            break;

          case "searchProducts":
            result = await productSearchQuery(requestBody.query);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                message: "Products searched succesfully",
                data: result,
              })
            );
            responseSent=true;
            break;
            case "Product_Review":
              // Parse the request body and destructure the necessary data
              const { userid, productId, title, rating, review } = requestBody;

              // Validate input data (you can add more specific validation if needed)
              if (!userid || !productId || !title || !rating || !review) {
                  res.writeHead(400, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ message: "Missing required fields" }));
                  responseSent = true;
                  return;
              }

              // Try to handle the review submission
              try {
                  // Call the reviewProduct function with the input data
                  const reviewResult = await reviewProduct(userid, productId, title, rating, review);

                  // Send a success response with the result
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({
                      message: "Review submitted successfully",
                      data: reviewResult
                  }));
                  responseSent = true;
              } catch (error) {
                  console.error("Error submitting review:", error);
                  // Send an error response if something goes wrong
                  res.writeHead(500, { "Content-Type": "application/json" });
                  res.end(
                      JSON.stringify({
                          message: "Error submitting review",
                          error: error.message,
                      })
                  );
                  responseSent = true;
              }
              break;
          }

        if (!responseSent) {
          // Check the flag
          // Only run this if no response has been sent yet
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ message: "Operation successful", data: result })
          );
        }
      } else if (req.method === "GET") {

                switch (trimmedPath) {
                  case "retrieve-pruchase-history":
 
                  try {
                  if (!requestBody.userId) {
                  throw new Error('User ID is missing in the request body');
                  }
                  const purchaseHistory = await getPurchaseHistoryByUserId(requestBody.userId);
                  
                  if (!purchaseHistory || purchaseHistory.data.length === 0) {//!purchaseHistory || purchaseHistory.data.length === 0
                  res.writeHead(404, { "Content-Type": "application/json" }); // Not Found status code
                  res.end(JSON.stringify({ message: "No purchase history found for the given user ID." }));
                  } else {
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ purchaseHistory: purchaseHistory.data }));
                  }
                  } catch (error) {
                  console.error("Error retrieving purchase history:", error);
                  res.writeHead(500, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ error: "Internal Server Error" }));
                  }
                  break;

                    case "retrieve-address-history":
                            const { userId, addressId } = requestBody; // Assuming userId is provided in the request body
                            try {
                                if (!userId || !addressId) {
                                    throw new Error('User ID or Address ID is missing in the request body');
                                }
                                const result = await retrieveAddressHistory(userId, addressId);

                                if (!result) {
                                    res.writeHead(404, { "Content-Type": "application/json" }); // Not Found status code
                                    res.end(JSON.stringify({ message: "User or address not found" }));
                                } else {
                                    res.writeHead(200, { "Content-Type": "application/json" });
                                    res.end(JSON.stringify({ addressHistory: result }));
                                }
                            } catch (error) {
                                console.error("Error retrieving address history:", error);
                                res.writeHead(500, { "Content-Type": "application/json" });
                                res.end(JSON.stringify({ error: "Internal Server Error" }));
                            }
                            break;
                    
                    case "fetch-cart-details":
                        try {
                          const {userId : userId}  = requestBody;
                          const cartDetails = await getCart(userId);
                          res.writeHead(200, { "Content-Type": "application/json" });
                          res.end(
                            JSON.stringify({
                              message: "Cart details fetched successfully",
                              data: cartDetails,
                            })
                          );
                        } catch (error) {
                          console.error("Error fetching cart details:", error);
                          res.writeHead(500, { "Content-Type": "application/json" });
                          res.end(
                            JSON.stringify({
                              message: "Error fetching cart details",
                              error: error.toString(),
                            })
                          );

                          
                          
                        }
                        break;



                        


                   case "get-watchlist":
                        try {                        
                            // Extract user information using the access token
                            const userInfo = await getUserInfo(token);
                            // Ensure that the user information is available
                            if (!userInfo) {
                                res.writeHead(401, { "Content-Type": "application/json" }); // Unauthorized status code
                                res.end(JSON.stringify({ error: "Unauthorized: Access token invalid or expired" }));
                                return;
                            }
                            // Retrieve the watchlist using the user information
                            const watchList = await getWatchlist(userInfo);

                            if (watchList.length === 0) {
                                res.writeHead(404, { "Content-Type": "application/json" }); // Not Found status code
                                res.end(JSON.stringify({ message: "Watchlist not found for this user" }));
                            } else {
                                res.writeHead(200, { "Content-Type": "application/json" });
                                res.end(JSON.stringify({ watchList }));
                            }
                        } catch (error) {
                            console.error("Error retrieving watchlist:", error);
                            res.writeHead(500, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ error: "Internal Server Error" }));
                        }
                        return;
       



          
          case "create-stripe-customer":
            const { userObjectId, email, name } = requestBody;
            createStripeCustomerAndUpdateDB(userObjectId, email, name)
              .then((customerResult) => {
                if (!res.headersSent) {
                  const statusCode = customerResult.success ? 200 : 400; // Use 400 to indicate a user-related error
                  res.writeHead(statusCode, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({ success: customerResult.success, data: customerResult })
                  );
                }
              })
              .catch((error) => {
                console.error("Error creating Stripe customer:", error);
                if (!res.headersSent) {
                  res.writeHead(500, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      success: false,
                      message: "Failed to create Stripe customer",
                      error: error.message,
                    })
                  );
                }
              });
            return;
          case "autocomplete":
            result = await autocompleteProductSearch(requestBody.query);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                message: "Autocomplete operation successful",
                data: result,
              })
            );
            break;

          case "fetch-product-performance":
            result = await fetchTopRatedProducts();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                message: "Product performance data fetched successfully",
                data: result,
              })
            );
            break;
          default:
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Not Found" }));
            return;
        }
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Not Found" }));
        return;
      }
    } catch (error) {
      console.error("Error handling request:", error);
      if (!res.headersSent) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "Error handling request",
            error: error.toString(),
          })
        );
      }
    }
  });
});

const PORT = 3000;
// calling through main or jasmine
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running! Listening at http://localhost:${PORT}`);
  });
} else {
  module.exports = server;
}