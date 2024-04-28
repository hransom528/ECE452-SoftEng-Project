const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { connectDBandClose } = require("../../dbConfig");

const PORT = 3000;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    console.log('Request for:', pathname);

    if (pathname === '/oauth2callback' || pathname === '/' || pathname === '/landing.css' || pathname === '/landing.js') {
        if (pathname === '/landing.css' || pathname === '/landing.js') {
            serveFile('Team1/Reg_lgn/landing' + pathname, res);
        } else {
            serveFile('Team1/Reg_lgn/landing/landingPage.html', res);
        }
    } else if (req.method === 'POST') {
        handlePostRequests(req, res, pathname);
    } else {
        // Serve files based on the actual path, adjusting for non-root requests
        serveFile('Team1/Reg_lgn' + pathname, res);
    }
});

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

function handlePostRequests(req, res, pathname) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        if (pathname === '/check-user') {
            const userInfo = JSON.parse(body);
            checkUser(userInfo, res);
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Endpoint not found' }));
        }
    });
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

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
