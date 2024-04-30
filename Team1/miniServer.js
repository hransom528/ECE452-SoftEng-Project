const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { v4: uuidv4 } = require('uuid');
const { connectDBandClose, openDBConnection } = require("../dbConfig");
const { getUserInfo } = require('./Reg_lgn/oAuthHandler.js');
// const {registerUser}=require('./Reg_lgn/regLogin');
const { verifyAddress } = require('../Team2/AddressValidationAPI.js');
const { getResponseFromOpenAI } = require('./ChatBot/openAi')
const { createStripeCustomerAndUpdateDBWithConnection, verifyCardAndUpdateDB, createPaymentAndProcessing } = require('../Team3/stripe.js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const PORT = 3000;

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    console.log('Request for:', pathname);

    if (pathname === '/get-user-profile' && req.method === 'GET') {
        // Handle the GET request for user profile
        await getUserProfile(req, res);
    } else if (pathname === '/purchase-premium-membership' && req.method === 'POST') {
            // Directly handle purchase requests
            handlePurchaseMembershipRequest(req, res);
            return;
    } else if (pathname === '/oauth2callback' || pathname === '/' || pathname === '/landing.css' || pathname === '/landing.js') {
        if (pathname === '/landing.css' || pathname === '/landing.js') {
            serveFile('Team1/Reg_lgn/landing' + pathname, res);
        } else {
            serveFile('Team1/Reg_lgn/landing/landingPage.html', res);
        }
    } else if (pathname === '/profile') {
        // Serve the userProfile.html
        serveFile('Team1/UserProfile/userProfile.html', res);
    } else if (pathname === '/chat') {
        serveFile('Team1/ChatBot/chat.html', res)
    } else if (pathname.match(/^\/chat\/.*/)) {
        // Serve userProfile's assets like CSS and JS files
        const assetPath = pathname.split('/chat/')[1]; // Get the file name after '/profile/'
        serveFile(`Team1/ChatBot/${assetPath}`, res);
    } else if (pathname.match(/^\/profile\/.*/)) {
        // Serve userProfile's assets like CSS and JS files
        const assetPath = pathname.split('/profile/')[1]; // Get the file name after '/profile/'
        serveFile(`Team1/UserProfile/${assetPath}`, res);
    } else if (req.method === 'POST') {
        handlePostRequests(req, res, pathname);
    } else if (req.method === 'PATCH') {
        handlePatchRequests(req, res, pathname);
    } else if (req.method === 'DELETE') {
        handleDeleteRequests(req, res, pathname);
    // } else if (pathname === '/Reg_lgn/onBoard/landing/landing.html') {
    //     serveFile('Team1/Reg_lgn/landing/landingPage.html', res);
    } else {
        // Serve files based on the actual path, adjusting for non-root requests
        serveFile('Team1' + pathname, res);
    }
});

function serveFile(filePath, res) {

    // Check if 'res' is defined
    if (!res) {
        console.error("Response object 'res' is not defined.");
        // return; // Or handle this scenario in a different way
    }

    // console.log('Serving file:', filePath);  // Log which file is being served
    const extname = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.pdf': 'application/pdf',
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';
    // console.log("cT: ", contentType)
    fs.readFile(filePath, (error, content) => {
        if (error) {
            console.error('File error:', error);
            res.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/html' });
            res.end(error.code === 'ENOENT' ? '404 Not Found' : 'Server error');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

async function getUserProfile(req, res) {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Unauthorized: No access token provided' }));
        return;
    }

    try {
        const userInfo = await getUserInfo(accessToken);
        const { db, client } = await connectDBandClose();
        const user = await db.collection('users').findOne({ email: userInfo.email });
        client.close();

        if (user) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(user));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User not found' }));
        }
    } catch (error) {
        console.error('Database error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error', message: error.message }));
    }
}

async function handlePurchaseMembershipRequest(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', async () => {
        console.log('Complete body received:', body);  // Log the complete body to debug
        let parsedBody;
        try {
            parsedBody = JSON.parse(body);
            console.log('Parsed body:', parsedBody);  // Log the parsed body to debug
            const stripeToken = parsedBody.stripeToken;
            if (!stripeToken) {
                throw new Error("Stripe token is missing.");
            }

            const accessToken = req.headers.authorization?.split(' ')[1];
            if (!accessToken) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Unauthorized: No access token provided' }));
                return;
            }

            const result = await purchasePremiumMembership(accessToken, stripeToken);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (error) {
            console.error('Error processing membership:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: error.message }));
        }
    });
}

function handlePostRequests(req, res, pathname) {
    if (pathname === '/cancel-premium-membership') {
        // Directly handle cancellation without reading a body
        cancelPremiumMembership(req, res);
        return;
    }

    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', async () => {
        let parsedBody;
        try {
            parsedBody = JSON.parse(body); // Parse the body only once outside of the switch statement
        } catch (error) {
            console.error('Error parsing request body:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON' }));
            return; // Return here to stop further execution in case of JSON parse error
        }

        // Handle endpoints that do not require access token
        if (pathname === '/check-user') {
            await checkUser(parsedBody, res);
            return; // Return early to prevent further execution
        } else if (pathname === '/registerUser') {
            await registerUser(parsedBody, res);
            return; // Return early to prevent further execution
        }

        // Extract the access token from the header
        const accessToken = req.headers.authorization?.split(' ')[1];
        if (!accessToken) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Unauthorized: No access token provided' }));
            return;
        }

        switch (pathname) {
    
            case '/add-shipping-address':
                try {
                    await addUserShippingAddress(req, res, parsedBody);
                } catch (error) {
                    console.error('Error adding address:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.toString() }));
                }
                break;

            case "/talkToAI":
                if (!accessToken) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Unauthorized: No access token provided' }));
                    return;
                }
                // Ensure body contains 'prompt'
                if (!parsedBody.prompt) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Prompt is required" }));
                    responseSent = true;
                    break;
                }
                try {
                    console.log("parsedBody: ", parsedBody)
                    await getResponseFromOpenAI(parsedBody)
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
            default:
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Endpoint not found' }));
            break;
        }
    });
}

function handlePatchRequests(req, res, pathname) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', async () => {
        try {
            const parsedBody = JSON.parse(body); // Parse the body to JSON

            switch (pathname) {
                case '/update-shipping-address':
                    await updateShippingAddress(req, res, parsedBody);
                    break;
                default:
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'PATCH endpoint not found' }));
                    break;
            }
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Bad request', message: 'Invalid JSON' }));
        }
    });
}

function handleDeleteRequests(req, res, pathname) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', async () => {
        try {
            switch (pathname) {
                case '/delete-shipping-address':
                    try {
                        const parsedBody = JSON.parse(body);
                        await deleteShippingAddress(req, res, parsedBody.addressId);
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Bad request', message: 'Invalid JSON' }));
                    }
                    break;
                case '/delete-user-profile':
                    deleteUserProfile(req, res);
                    break;            
            default:
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Endpoint not found' }));
                break;
            }
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Bad request', message: 'Invalid JSON' }));
        }
    });
}

async function registerUser(userData, res) {
    try {
        // console.log("here is data coming in: ", userData);
        const { name, email, address } = userData;
        // console.log("here is address we get: ", address)
        // console.log("type: ", typeof address)
        // // Extract the necessary fields for address verification
        // const addressForVerification = {
        //     street: address.street,
        //     city: address.city,
        //     state: address.state,
        //     postalCode: address.postalCode,
        //     country: address.country
        // };

        // console.log("Address for verification: ", addressForVerification, addressForVerification.type);

        const validationResponse = await verifyAddress(address);  // Expecting an address object
        if (!validationResponse.isValid) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: validationResponse.message }));
            return;
        }

        const user = {
            email,
            name,
            shippingAddresses: [{ ...address, addressId: require('uuid').v4() }],
            shoppingCart: { cartId: '', items: [], cartSubtotal: 0 },
            watchlist: [],
            orderHistory: [],
            reviews: [],
            about: [userData.personal1, userData.personal2]
        };

        const { db, client } = await connectDBandClose();
        const result = await db.collection('users').insertOne(user);
        client.close();

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User registered successfully', userId: result.insertedId }));
    } catch (error) {
        console.error('Error registering user:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error', message: error.message }));
    }
}

async function checkUser(userInfo, res) {
    try {
        const { db, client } = await connectDBandClose();
        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne({ email: userInfo.email });
        client.close();  // Ensure closing the database connection

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ exists: !!user }));
    } catch (error) {
        console.error('Database error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

function getAccessToken(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null; // or throw an error as per your error handling policy
    }
    return authHeader.substring(7); // Skip "Bearer " to get the actual token
}

async function addUserShippingAddress(req, res, parsedBody) {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Unauthorized: No access token provided' }));
        return;
    }

    try {
        const userInfo = await getUserInfo(accessToken);
        if (!userInfo) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Invalid token or user not found' }));
            return;
        }

        const { recipientName, street, city, state, postalCode, country, isDefault } = parsedBody; // Use parsedBody here
        const newAddress = { recipientName, street, city, state, postalCode, country, isDefault };

        const validationResponse = await verifyAddress(newAddress);
        if (!validationResponse.isValid) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: validationResponse.message }));
            return;
        }

        const { db, client } = await connectDBandClose();
        const validatedAddress = { ...newAddress, addressId: uuidv4() };
        const result = await db.collection('users').updateOne(
            { email: userInfo.email },
            { $push: { shippingAddresses: validatedAddress } }
        );

        client.close();
        if (result.matchedCount === 0) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User not found' }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Address added successfully', addressId: validatedAddress.addressId }));
    } catch (error) {
        console.error('Error adding address:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error', message: error.message }));
    }
}

async function updateShippingAddress(req, res, parsedBody) {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Unauthorized: No access token provided' }));
        return;
    }

    const { addressId, updatedAddress } = parsedBody;
    const userInfo = await getUserInfo(accessToken);
    if (!userInfo) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid token or user not found' }));
        return;
    }

    // Verify the address first
    try {
        const verificationResult = await verifyAddress(updatedAddress);
        if (!verificationResult.isValid) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Address verification failed: ' + verificationResult.message }));
            return;
        }
    } catch (verificationError) {
        console.error('Address verification error:', verificationError);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to verify address', message: verificationError.message }));
        return;
    }

    try {
        const { db, client } = await connectDBandClose();
        const usersCollection = db.collection("users");
        const filter = { "shippingAddresses.addressId": addressId };
        const updateFields = {};

        // Construct the update query for individual fields
        Object.keys(updatedAddress).forEach(key => {
            updateFields[`shippingAddresses.$.${key}`] = updatedAddress[key];
        });

        const result = await usersCollection.updateOne(filter, { $set: updateFields });

        client.close();
        if (result.modifiedCount === 0) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Address not found or unchanged' }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Address updated successfully' }));
    } catch (error) {
        console.error('Error updating address:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error', message: error.message }));
    }
}

async function deleteShippingAddress(req, res, addressId) {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Unauthorized: No access token provided' }));
        return;
    }

    const userInfo = await getUserInfo(accessToken);
    if (!userInfo) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid token or user not found' }));
        return;
    }

    if (!addressId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Address ID is required' }));
        return;
    }

    try {
        const { db, client } = await connectDBandClose();
        const usersCollection = db.collection("users");
        // Use $in operator for addressId to ensure it is treated as a string not ObjectId
        const result = await usersCollection.updateOne(
            { email: userInfo.email },
            { $pull: { shippingAddresses: { addressId: { $in: [addressId] } } } }
        );

        client.close();

        if (result.modifiedCount === 0) {
            // No address was deleted, possibly because it was not found or already deleted
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'No address found or already deleted', noChange: true }));
        } else {
            // Address was successfully deleted
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Address deleted successfully', success: true }));
        }
    } catch (error) {
        console.error('Error deleting address:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error', message: error.message }));
    }
}

async function deleteUserProfile(req, res) {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Unauthorized: No access token provided' }));
        return;
    }

    try {
        const userInfo = await getUserInfo(accessToken);
        const { db, client } = await connectDBandClose();
        const result = await db.collection('users').deleteOne({ email: userInfo.email });
        client.close();

        if (result.deletedCount === 0) {
            throw new Error("User not found or already deleted");
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: "User deleted successfully" }));
    } catch (error) {
        console.error('Error deleting user:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: error.message }));
    }
}

// Function to purchase premium membership
async function purchasePremiumMembership(accessToken, stripeToken) {
    let client;
    try {
        const { db, clientTemp } = await openDBConnection();  // Open the database connection and keep it throughout the operation
        client = clientTemp;

        const userInfo = await getUserInfo(accessToken);
        if (!userInfo) {
            throw new Error("Access token invalid or user not found.");
        }

        const user = await db.collection('users').findOne({ email: userInfo.email });
        if (!user) {
            throw new Error("User not found.");
        }

        // Check if a Stripe customer already exists
        if (user.stripeCustomerId) {
            return { success: false, message: "Stripe customer already exists for this user." };
        }

        // Create a new Stripe customer and update MongoDB, pass db explicitly
        const result1 = await createStripeCustomerAndUpdateDBWithConnection(user._id, user.email, user.name, db);
        if (!result1.success) {
            throw new Error(result1.message);
        }

        // Verify the card with the newly created Stripe customer ID and the provided Stripe token
        const result2 = await verifyCardAndUpdateDB(user._id, result1.stripeCustomerId, stripeToken, db);
        if (!result2.success) {
            throw new Error(result2.message);
        }

        // Assuming a fixed membership fee for simplicity
        const membershipFee = 19.99;
        const paymentResult = await createPaymentAndProcessing(result1.stripeCustomerId, result2.paymentMethodId, membershipFee, 'usd', 'card', db);
        if (!paymentResult.success) {
            throw new Error(paymentResult.message);
        }

        // Update the user's premium status in MongoDB
        await db.collection('users').updateOne({ _id: user._id }, { $set: { isPremium: true } });

        return { success: true, message: "Membership purchased successfully." };
        
    } catch (error) {
        console.error('Purchase Premium Membership Error:', error);
        return { success: false, message: error.message };
    } finally {
        if (client) {
            client.close();  // Ensure the MongoDB connection is closed
            console.log("MongoDB connection closed.");
        }
    }
}

async function cancelPremiumMembership(req, res) {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Unauthorized: No access token provided' }));
        return;
    }

    try {
        const userInfo = await getUserInfo(accessToken);
        const { db, client } = await connectDBandClose();
        const user = await db.collection('users').findOne({ email: userInfo.email });
        if (!user) {
            client.close();
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User not found' }));
            return;
        }

        // Cancel the Stripe subscription if there's one active
        if (user.stripeSubscriptionId) {
            await stripe.subscriptions.del(user.stripeSubscriptionId);
        }

        // Update the user's premium status in the database
        await db.collection('users').updateOne({ _id: user._id }, { $set: { isPremium: false } });

        client.close();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: "Premium membership cancelled successfully." }));
    } catch (error) {
        console.error('Error cancelling premium membership:', error);
        client?.close();
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: error.message }));
    }
}

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});