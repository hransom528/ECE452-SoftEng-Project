const { MongoClient, ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig.js');
const mongoURI = process.env.MONGO_URI;

// Connect to MongoDB
async function connectToMongoDB() {
    try {
        const client = await MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');
        return client.db(); // Returns the default database
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

// List shipments
async function listShipments(req, res, db) {
    try {
        const shipmentsCollection = db.collection('shipments');
        const shipments = await shipmentsCollection.find({}).toArray();
        res.status(200).json(shipments);
    } catch (err) {
        console.error('Error listing shipments:', err);
        res.status(500).send('Internal Server Error');
    }
}

// Create a shipment
async function createShipment(req, res, db) {
    try {
        const newShipment = req.body;
        const shipmentsCollection = db.collection('shipments');
        const result = await shipmentsCollection.insertOne(newShipment);
        res.status(201).json(result.ops[0]);
    } catch (err) {
        console.error('Error creating shipment:', err);
        res.status(400).send('Bad Request');
    }
}

// Retrieve a shipment
async function retrieveShipment(req, res, db) {
    try {
        const shipmentId = req.params.id;
        const shipmentsCollection = db.collection('shipments');
        const shipment = await shipmentsCollection.findOne({ _id: ObjectId(shipmentId) });
        if (!shipment) {
            res.status(404).send('Shipment not found');
            return;
        }
        res.status(200).json(shipment);
    } catch (err) {
        console.error('Error retrieving shipment:', err);
        res.status(500).send('Internal Server Error');
    }
}

// Buy a shipment
async function buyShipment(req, res) {
    // Implement purchase logic here
    res.status(200).send('Shipment purchased successfully');
}

// Track a shipment
async function trackShipment(req, res) {
    // Implement tracking logic here
    res.status(200).send('Tracking information');
}

module.exports = {
    connectToMongoDB,
    listShipments,
    createShipment,
    retrieveShipment,
    buyShipment,
    trackShipment
};
