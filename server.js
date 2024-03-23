const { registerUser } = require('./Team1/Reg_lgn/registration');
const { getAccessTokenFromCode, getUserInfo } = require('./Team1/Reg_lgn/oAuthHandler');

require('dotenv').config();

const http = require('http');
const url = require('url');
const { StringDecoder } = require('string_decoder');
const {updateListings } = require('./Team3/UC8update_listings.js'); 
const { addProduct } = require('./Team3/UCCreateProduct.js');

const { 
    updateUserEmail,
    updateUserName,
    updateUserPhoneNumber,
    updateUserPremiumStatus,
    addUserShippingAddress,
    updateUserShippingAddress
} = require('./Team1/userProfile');

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');
    
    const decoder = new StringDecoder('utf-8');
    let buffer = '';

    if (req.method === 'POST') {
        req.on('data', (data) => {
            buffer += decoder.write(data);
        });

        req.on('end', async () => {
            buffer += decoder.end();

            // Handle POST requests
            try {
                const requestBody = JSON.parse(buffer);
                let result = null;

                switch (trimmedPath) {
                    case 'update-email':
                        result = await updateUserEmail(requestBody.userId, requestBody.newEmail);
                        break;
                    case 'update-listings':
                        if (!Array.isArray(requestBody.productIds) || typeof requestBody.updateFields !== 'object') {
                            throw new Error('Invalid input for updating listings');
                        }
                        result = await updateListings(requestBody.productIds, requestBody.updateFields);
                        break;
                    case 'update-name':
                        result = await updateUserName(requestBody.userId, requestBody.newName);
                        break;
                    case 'update-phone-number':
                        result = await updateUserPhoneNumber(requestBody.userId, requestBody.newPhoneNumber);
                        break;
                    case 'update-premium-status':
                        result = await updateUserPremiumStatus(requestBody.userId, requestBody.isPremium);
                        break;
                    case 'add-shipping-address':
                        result = await addUserShippingAddress(requestBody.userId, requestBody.newAddress);
                        break;
                    case 'update-shipping-address':
                        result = await updateUserShippingAddress(requestBody.userId, requestBody.addressId, requestBody.updatedAddress);
                        break;
                    case 'add-product':
                        result = await addProduct(requestBody);
                        break;
                    case 'registerUser':
                        const accessToken = requestBody.accToken; // part of post request JSON
                        if (!accessToken) {
                            throw new Error('Not able to authorize'); // maybe give res writehead here
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
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: 'OAuth Error', error: oauthError.message }));
                            return;
                        }

                        break;

                    default:
                        throw new Error('Route not found');
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Operation successful', data: result }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Error processing request', error: error.message }));
            }
        });
    } else {
        // Default response for non-POST requests or unmatched routes
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not Found' }));
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
