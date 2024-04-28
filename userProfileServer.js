const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Resolve the base directory safely using path.resolve()
    let baseDir = path.resolve(__dirname, 'Team1', 'UserProfile');
    
    // Normalize the request URL and prevent directory traversal
    let safeSuffix = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');
    let safeFilePath = path.join(baseDir, safeSuffix === '/' ? 'userProfile.html' : safeSuffix);
    
    // Ensure that the resulting path starts with the base directory path
    if (!safeFilePath.startsWith(baseDir + path.sep)) {
        res.writeHead(400);
        return res.end('Invalid path');
    }

    let extname = path.extname(safeFilePath);
    let contentType = 'text/html';

    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }

    // Use fs.promises.readFile to read the file asynchronously
    fs.promises.readFile(safeFilePath)
        .then(content => {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        })
        .catch(error => {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    import('open').then(open => {
        open.default(`http://localhost:${PORT}`);
    }).catch(error => {
        console.error('Failed to open browser:', error);
    });
});
