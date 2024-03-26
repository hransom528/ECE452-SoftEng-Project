const { connectDBandClose } = require('../dbConfig'); 

test('Database Connection Test', async () => {
    expect(await connectDBandClose()).toBeTruthy();
});