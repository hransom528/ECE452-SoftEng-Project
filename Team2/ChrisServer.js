
require("dotenv").config();
const {checkoutCart} = require("./checkoutV2");
const {getPurchaseHistoryByUserId} = require("./purchaseHistory.js");
const { ObjectId } = require("mongodb");


const { StringDecoder } = require("string_decoder");
const http = require('http');
const url = require('url');

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    if (req.method === "GET") {
        let result = null;

        // Extract user ID from the path
        const pathParts = trimmedPath.split('/');
        if (pathParts[0] === "retrieve-purchase-history" && pathParts.length === 2) {
            const userId = pathParts[1];

            try {
                const purchaseHistory = await getPurchaseHistoryByUserId(userId);

                if (!purchaseHistory || purchaseHistory.data.length === 0) {
                    res.writeHead(404, { "Content-Type": "application/json" });
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
        } else {
            res.writeHead(404);
            res.end();
        }
    }
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
