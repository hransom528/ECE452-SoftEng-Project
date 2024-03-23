require('dotenv').config();
const { ObjectId } = require('mongodb');
const http = require('http');
const url = require('url');
const { StringDecoder } = require('string_decoder');
const { createPaymentIntent, saveCard } = require('./Team3/stripe.js');
const {updateListings } = require('./Team3/UC8update_listings.js'); 
const { addProduct } = require('./Team3/UCCreateProduct.js');
const { updateDiscount } = require('./Team3/UC10DiscountManagement.js');
const { 
    updateUserEmail,
    updateUserName,
    updateUserPhoneNumber,
    updateUserPremiumStatus,
    addUserShippingAddress,
    updateUserShippingAddress
} = require('./Team1/userProfile');

const { startChat } = require('./Team1/chatSupport.js');

// Initialize chat instance before starting server
let chatInstance = null;
startChat().then(chat => {
    chatInstance = chat;
}).catch(error => console.error('Failed to start chat:', error));


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
            console.log("Received buffer:", buffer);

            // Handle POST requests
            
            try {
                const requestBody = JSON.parse(buffer);
                let result = null;

                switch (trimmedPath) {
                    case 'update-email':
                        result = await updateUserEmail(requestBody.userId, requestBody.newEmail);
                        break;
                    case 'update-listings':
                            console.log("Received productIds for update:", requestBody.productIds);
                            console.log("Received update fields:", requestBody.updateFields);
                            console.log("Received fields to remove:", requestBody.unsetFields); // Log the fields to remove
                        
                            if (!Array.isArray(requestBody.productIds) || 
                                typeof requestBody.updateFields !== 'object' ||
                                requestBody.productIds.some(id => !ObjectId.isValid(id)) ||
                                (requestBody.unsetFields && !Array.isArray(requestBody.unsetFields))) { // Check if unsetFields is an array if it exists
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ message: 'Invalid input for updating listings' }));
                                return;  
                            }
                        
                            result = await updateListings(requestBody.productIds, requestBody.updateFields, requestBody.unsetFields); // Pass the unsetFields as well
                            break;
                    case 'create-payment-intent':
                                if (requestBody.amount && requestBody.currency) {
                                    result = await createPaymentIntent(requestBody.amount, requestBody.currency);
                                } else {
                                    throw new Error('Missing required fields for payment intent');
                                }
                                break;
                        
                    case 'save-card':
                                if (requestBody.paymentMethodId && requestBody.customerId) {
                                    result = await saveCard(requestBody.paymentMethodId, requestBody.customerId);
                                } else {
                                    throw new Error('Missing required fields for saving card');
                                }
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
                    case 'send-chat-message':
                        if (!chatInstance) {
                            res.writeHead(503, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: 'Chat service is not available' }));
                            return;
                        }
                        try {
                            const chatResponse = await chatInstance.handleIncomingMessage(requestBody.message);
                            result = { reply: chatResponse };
                        } catch (error) {
                            console.error('Error during chat message handling:', error);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: 'Failed to handle chat message', error: error.toString() }));
                            return;
                        }
                        break;
                                            
                    default:
                        throw new Error('Route not found');
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Operation successful', data: result }));
            } catch (error) {
                console.error("Error parsing JSON:", error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid JSON format', error: error.toString() }));
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
