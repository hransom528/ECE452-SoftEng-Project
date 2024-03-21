const http = require('http');
const { updateUserEmail } = require('./Team1/userProfile');
const { updateListings } = require('./Team3/UC8update_listings.js');
const url = require('url');
const { StringDecoder } = require('string_decoder');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Handling POST request to /update-email
    if (trimmedPath === 'update-email' && req.method === 'POST') {
        const decoder = new StringDecoder('utf-8');
        let buffer = '';

        req.on('data', (data) => {
            buffer += decoder.write(data);
        });

        req.on('end', async () => {
            buffer += decoder.end();
            const requestBody = JSON.parse(buffer);

            try {
                // Assuming requestBody contains { userId, newEmail }
                const result = await updateUserEmail(requestBody.userId, requestBody.newEmail);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({ message: 'Email updated successfully', data: result }));
            } catch (error) {
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({ message: 'Error updating email', error: error.toString() }));
            }
        });
    } 
    if (trimmedPath === 'update-listings' && req.method === 'POST') {
        const decoder = new StringDecoder('utf-8');
        let buffer = '';

        req.on('data', (data) => {
            buffer += decoder.write(data);
        });

        req.on('end', async () => {
            buffer += decoder.end();
            const requestBody = JSON.parse(buffer);

            try {
                // Assuming requestBody contains the necessary data for updateListings
                const result = await updateListings(requestBody.productIds, requestBody.updateFields);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({ message: 'Listings updated successfully', data: result }));
            } catch (error) {
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({ message: 'Error updating listings', error: error.toString() }));
            }
        });
    }else {
        // Default response for unmatched routes
        res.writeHead(404);
        res.end('Not Found');
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});