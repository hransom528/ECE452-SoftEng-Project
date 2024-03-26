require("dotenv").config();
const { ObjectId } = require("mongodb");
const http = require("http");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const {
    createStripeCustomerAndUpdateDB,
    verifyCardAndUpdateDB,
    createPaymentAndProcessing,
} = require("./Team3/stripe.js");
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
const { addToCart, removeFromCart } = require("./Team2/Cart.js");

const {
    updateUserEmail,
    // this is a change
    updateUserName,
    updateUserPhoneNumber,
    updateUserPremiumStatus,
    addUserShippingAddress,
    updateUserShippingAddress,
} = require("./Team1/userProfile");
const { startChat } = require("./Team1/chatSupport.js");
const {
    createPremiumMembership,
    cancelPremiumMembership,
} = require("./Team1/membershipManagement.js");
const { registerUser, loginUser } = require("./Team1/Reg_lgn/regLogin");
const {
    getAccessTokenFromCode,
    getUserInfo,
} = require("./Team1/Reg_lgn/oAuthHandler");
const { getResponseFromOpenAI } = require("./Team1/ChatBot/openAi");

//const { productFilterQuery} = require("./Team4/Filter_Search.js") other changes;
//const { productFilterQuery} = require("./Team4/Filter_Search.js");
const {checkout} = require('./Team2/Checkout.js');

// Initialize chat instance before starting server
let chatInstance = null;
let responseSent = false;
startChat()
    .then((chat) => {
        chatInstance = chat;
    })
    .catch((error) => console.error("Failed to start chat:", error));

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, "");

    const decoder = new StringDecoder("utf-8");
    let buffer = "";

    req.on("data", (data) => {
        buffer += decoder.write(data);
    });

    req.on("end", async () => {
        buffer += decoder.end();
        try {
            if (req.method === "POST") {
                const requestBody = JSON.parse(buffer);
                let result = null;

                switch (trimmedPath) {

                    case 'checkout':
                        const { userId, cartId, address, paymentToken } = requestBody;
                        await checkout(userId, cartId, address, paymentToken);
                        result = { message: 'Checkout successful' };
                        break;

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
                        ); // Pass the unsetFields as well
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
                            // Assuming deleteListings function returns the result of deletion operation,
                            // you can further process this result or directly send a success response
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
                    case "create-stripe-customer":
                        const { userObjectId, email, name } = requestBody;
                        createStripeCustomerAndUpdateDB(userObjectId, email, name)
                            .then((customerResult) => {
                                if (!res.headersSent) {
                                    res.writeHead(200, { "Content-Type": "application/json" });
                                    res.end(
                                        JSON.stringify({ success: true, data: customerResult })
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
                        return; // Prevent further execution
                    // Add new case for verifying card details
                    case "verify-card-details":
                        try {
                            const { userObjectId, stripeCustomerId, stripeToken } =
                                requestBody;
                            const verifyResult = await verifyCardAndUpdateDB(
                                userObjectId,
                                stripeCustomerId,
                                stripeToken
                            );
                            res.writeHead(200, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ success: true, data: verifyResult }));
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
                        return; // Exit the function after handling the request

                    // userProfile.js
                    case "update-email":
                        result = await updateUserEmail(
                            requestBody.userId,
                            requestBody.newEmail
                        );
                        break;
                    case "update-email":
                        result = await updateUserEmail(
                            requestBody.userId,
                            requestBody.newEmail
                        );
                        break;
                    case "update-listings":
                        if (
                            !Array.isArray(requestBody.productIds) ||
                            typeof requestBody.updateFields !== "object" ||
                            requestBody.productIds.some((id) => !ObjectId.isValid(id)) ||
                            (requestBody.unsetFields &&
                                !Array.isArray(requestBody.unsetFields))
                        ) {
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
                    case "update-name":
                        result = await updateUserName(
                            requestBody.userId,
                            requestBody.newName
                        );
                        break;
                    case "update-phone-number":
                        result = await updateUserPhoneNumber(
                            requestBody.userId,
                            requestBody.newPhoneNumber
                        );
                        break;
                    case "update-premium-status":
                        result = await updateUserPremiumStatus(
                            requestBody.userId,
                            requestBody.isPremium
                        );
                        break;
                    case "add-shipping-address":
                        result = await addUserShippingAddress(
                            requestBody.userId,
                            requestBody.newAddress
                        );
                        break;
                    case "update-shipping-address":
                        result = await updateUserShippingAddress(
                            requestBody.userId,
                            requestBody.addressId,
                            requestBody.updatedAddress
                        );
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
                        const accessToken = requestBody.accToken; // part of post request JSON
                        if (!accessToken) {
                            throw new Error("Not able to authorize"); // maybe give res writehead here
                        }
                        try {
                            // exchanging code for for access Token
                            // const accessToken = await getAccessTokenFromCode(authCode);

                            // use access token to get user's info from google account
                            const userInfo = await getUserInfo(accessToken);

                            //use the info we got to finish registering the user
                            result = await registerUser(userInfo, requestBody);
                        } catch (oauthError) {
                            // handling auth errors
                            res.writeHead(400, { "Content-Type": "application/json" });
                            res.end(
                                JSON.stringify({
                                    message: "OAuth Error",
                                    error: oauthError.message,
                                })
                            );
                            return;
                        }
                        break;

                    case "loginUser":
                        const accToken = requestBody.accToken; // part of post request JSON
                        if (!accToken) {
                            res.writeHead(400, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ message: "Access Token is required" }));
                            return;
                        }
                        try {
                            // Use access token to get user's info from Google account
                            const userInfo = await getUserInfo(accToken);

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
                        } catch (loginError) {
                            // handling login errors
                            res.writeHead(400, { "Content-Type": "application/json" });
                            res.end(
                                JSON.stringify({
                                    message: "Login Error",
                                    error: loginError.message,
                                })
                            );
                            return;
                        }
                        break;

                    case "chatWith-AI":
                        // Ensure body contains 'prompt'
                        if (!requestBody.prompt) {
                            res.writeHead(400, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ message: "Prompt is required" }));
                            responseSent = true;
                            break;
                        }

                        await getResponseFromOpenAI(requestBody)
                            .then((response) => {
                                console.log("AI Response:", response); // Debugging line
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

                        break;

                    // chatSupport.js
                    case "send-chat-message":
                        if (!chatInstance) {
                            res.writeHead(503, { "Content-Type": "application/json" });
                            res.end(
                                JSON.stringify({ message: "Chat service is not available" })
                            );
                            return;
                        }
                        try {
                            const chatResponse = await chatInstance.handleIncomingMessage(
                                requestBody.message
                            );
                            result = { reply: chatResponse };
                        } catch (error) {
                            console.error("Error during chat message handling:", error);
                            res.writeHead(500, { "Content-Type": "application/json" });
                            res.end(
                                JSON.stringify({
                                    message: "Failed to handle chat message",
                                    error: error.toString(),
                                })
                            );
                            return;
                        }
                        break;

                    // membershipManagement.js
                    case "create-premium-membership":
                        if (!requestBody.userId || !requestBody.stripeCustomerId || !requestBody.stripeToken) {
                            throw new Error("Missing required parameters for creating premium membership");
                        }
                        result = await createPremiumMembership(requestBody.userId, requestBody.stripeCustomerId, requestBody.stripeToken);
                        break;
                    case "cancel-premium-membership":
                        if (!requestBody.userId) {
                            throw new Error(
                                "Missing userId for cancelling premium membership"
                            );
                        }
                        result = await cancelPremiumMembership(requestBody.userId);
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
                }

                if (!responseSent) {
                    // Check the flag
                    // Only run this if no response has been sent yet
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(
                        JSON.stringify({ message: "Operation successful", data: result })
                    );
                }
            }
            else if (req.method === "GET") {
                const requestBody = JSON.parse(buffer);
                let result = null;

                switch (trimmedPath) {
                    case "filterCatalog":
                        result = await productFilterQuery(requestBody);
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(
                            JSON.stringify({
                                message: "Products filtered succesfully",
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
        }
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Not Found" }));
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
server.listen(PORT, () => {
    console.log(`Server running! Listening at http://localhost:${PORT}`);
});
