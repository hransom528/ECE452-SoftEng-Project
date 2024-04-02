//node populateDB.js

const { MongoClient } = require('mongodb');
const faker = require('faker');
const mongoURI = 'mongodb+srv://admin:SoftEng452@cluster0.qecmfqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Establish a connection to MongoDB
async function connectDB() {
    const client = new MongoClient(mongoURI);
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        return client;
    } catch (error) {
        console.error('Connection to MongoDB failed:', error);
        process.exit(1);
    }
}

// function generateFakeData() {
//     return {
//       name: `${faker.name.firstName()} ${faker.datatype.number()}`,
//       description: faker.commerce.productDescription(),
//       brand: faker.company.companyName(),
//       type: faker.commerce.productMaterial(),
//       price: faker.commerce.price(),
//       stockQuantity: faker.datatype.number({ min: 1, max: 100 }),
//       images: [
//         faker.image.imageUrl()
//       ],
//       specs: {
//         weight: `${faker.datatype.number({ min: 1, max: 20 })} lbs`
//       },
//       trendingScore: faker.datatype.number({ min: 1, max: 10 }),
//       topTrending: faker.datatype.boolean(),
//       rating: faker.datatype.number({ min: 1, max: 5 })
//     };
//   }

function generateFakeData() {
    const productTypes = ['Home Gym', 'Treadmill', 'Elliptical', 'Exercise Bike', 'Barbell', 'Dumbell', 'Bench'];
    const productAdjectives = ['Multi-purpose', 'High-quality', 'Compact', 'Foldable'];
    const productMaterial = ['Steel', 'Iron', 'Plastic', 'Composite', 'Titanium'];
    const brands  = [
        'Nike', 'Adidas', 'Under Armour', 'Reebok', 'Puma', 'Asics', 'New Balance',
        'Brooks', 'Lululemon', 'Gymshark', 'Rogue Fitness', 'Bowflex', 'Peloton',
        'Nautilus', 'NordicTrack', 'Life Fitness', 'Precor', 'Cybex', 'ProForm',
        'Gold gym'];
    const brand = faker.random.arrayElement(brands);
    const type = faker.random.arrayElement(productTypes);
    const adjective = faker.random.arrayElement(productAdjectives);
    const material = faker.random.arrayElement(productMaterial);
  
    return {
      name: `${brand} ${adjective} ${type}`,
      description: `The ${adjective.toLowerCase()} ${material.toLowerCase()} design is perfect for any home gym setup.`,
      brand: brand,
      type: type,
      price: parseFloat(faker.commerce.price(15, 500, 2)), // Prices between $15 and $500
      stockQuantity: faker.datatype.number({ min: 1, max: 50 }), // Quantity between 1 and 50
      images: [
        faker.image.imageUrl(640, 480, 'sports', true) // Random sports-related image
      ],
      specs: {
        weight: `${faker.datatype.number({ min: 5, max: 100 })} lbs` // Weight between 5 and 100 lbs
      },
      trendingScore: faker.datatype.number({ min: 1, max: 10 }), // Trending score between 1 and 10
      topTrending: faker.datatype.boolean(), // Randomly true or false
      rating: faker.datatype.number({ min: 1, max: 5 }) // Rating between 1 and 5
    };
  }

async function populateDatabase(client, numberOfEntries = 50) {
    const collection = client.db('website').collection('products');
    for (let i = 0; i < numberOfEntries; i++) {
        const fakeData = generateFakeData();
        await collection.insertOne(fakeData);
    }
    console.log(`${numberOfEntries} fake data entries inserted into database.`);
}

async function main() {
    const client = await connectDB();
    try {
        await populateDatabase(client, 10); // for example, create 10 fake data entries
    } finally {
        await client.close();
    }
}

main();
