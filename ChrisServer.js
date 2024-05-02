require("dotenv").config();
const {checkoutCart} = require("./Team2/checkoutV2");
const {getPurchaseHistoryByUserId} = require("./Team2/purchaseHistory.js");
const { ObjectId } = require("mongodb");
const http = require("http");
const url = require("url");
const {getUserInfo} = require("./Team1/Reg_lgn/oAuthHandler.js");


const { StringDecoder } = require("string_decoder");


const cors = require('cors');





let responseSent = false;
let result;

const server = http.createServer(async (req, res) => {
    // Enable CORS for all responses

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    try {
          // Handle preflight request
          if (req.method === 'OPTIONS') {
             res.writeHead(204);
             res.end();
              return;
           }
          
       if (req.method === "POST") {
        const requestBody = JSON.parse(buffer);
        let result = null;

          switch (trimmedPath) {
                    
    

          case "checkout":
          
            if (!token) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Access Token is required" }));
              responseSent = true;
              return;
            }
            userInfo = await getUserInfo(token);
          const { userId, billingAddr, shippingAddr, paymentInfo } = requestBody;
          result = await checkoutCart(userId, billingAddr, shippingAddr, paymentInfo);
                


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
        //const requestBody = JSON.parse(buffer);
        

        let result = null;

        // Extract user ID from the path
        const pathParts = trimmedPath.split('/');
        if (pathParts[0] === "retrieve-purchase-history" && pathParts.length === 2) {
            const userId = pathParts[1];
          console.log
            try {
              if (!token) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Access Token is required" }));
                responseSent = true;
                return;
              }
              userInfo = await getUserInfo(token);
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
