const { productSearchQuery } = require('../Product_Search.js');
const { autocompleteProductSearch } = require('../autocomplete.js');

test('Search Test', async () => {
    expect(await productSearchQuery("bar")).toBeTruthy();
});

test('Search Test', async () => {
    expect(await autocompleteProductSearch("bar")).toBeTruthy();
});
