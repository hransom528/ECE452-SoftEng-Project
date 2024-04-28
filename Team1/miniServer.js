const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { v4: uuidv4 } = require('uuid');
const { connectDBandClose } = require("../dbConfig");
const { getUserInfo } = require('./Reg_lgn/oAuthHandler.js');
const { verifyAddress } = require('../Team2/AddressValidationAPI.js');

const PORT = 3000;

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    console.log('Request for:', pathname);

    if (pathname === '/get-user-profile' && req.method === 'GET') {
        // Handle the GET request for user profile
        await getUserProfile(req, res);
    } else if (pathname.startsWith('/home') || pathname.startsWith('/onBoard')) {
            // Serve files from the Reg_lgn directory for '/home' and '/onBoard'
            serveFile('Team1/Reg_lgn' + pathname, res);    
    } else if (pathname === '/profile') {
        // Serve the userProfile.html
        serveFile('Team1/UserProfile/userProfile.html', res);
    } else if (pathname.match(/^\/profile\/.*/)) {
        // Serve userProfile's assets like CSS and JS files
        const assetPath = pathname.split('/profile/')[1]; // Get the file name after '/profile/'
        serveFile(`Team1/UserProfile/${assetPath}`, res);
        
    } else if (pathname === '/oauth2callback' || pathname === '/' || pathname === '/landing.css' || pathname === '/landing.js') {
        if (pathname === '/landing.css' || pathname === '/landing.js') {
            serveFile('Team1/Reg_lgn/landing' + pathname, res);
        } else {
            serveFile('Team1/Reg_lgn/landing/landingPage.html', res);
        }

    } else if (req.method === 'GET') {
        switch (pathname) {
            case '/get-user-profile':
                await getUserProfile(req, res);
                break;
            // ... handle other GET cases
        }
    } else if (req.method === 'POST') {
        // Accumulate the request body data
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            // Parse the body and handle the request based on the pathname
            const parsedBody = JSON.parse(body);
            switch (pathname) {
                case '/update-shipping-address':
                    await updateShippingAddress(req, res, parsedBody);
                    break;
                case '/check-user':
                    await checkUser(req, res, parsedBody);
                    break;

                case '/add-shipping-address':
                    try {
                        await addUserShippingAddress(req, res, parsedBody);
                    } catch (error) {
                        console.error('Error adding address:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.toString() }));
                    }
                    break;

                // ... handle other POST cases
            }
        });
    } else if (req.method === 'DELETE') {
        switch (pathname) {
            case '/delete-shipping-address':
                await deleteShippingAddress(req, res);
                break;
            // ... handle other DELETE cases
        }
    } else {
        // Serve files based on the actual path, adjusting for non-root requests
        serveFile('Team1' + pathname, res);
    }
});

function getAccessToken(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null; // or throw an error as per your error handling policy
    }
    return authHeader.substring(7); // Skip "Bearer " to get the actual token
}

function serveFile(filePath, res) {

    console.log('Serving file:', filePath);  // Log which file is being served
    const extname = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';
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

async function checkUser(req, res, userInfo) {
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

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});