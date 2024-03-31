// shipments.js
const { ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig');

// List shipments
async function listShipments(req, res) {
    try {
        const db = await connectDB();
        const shipmentsCollection = db.collection('shipments');
        const shipments = await shipmentsCollection.find({}).toArray();
        res.status(200).json(shipments);
    } catch (err) {
        console.error('Error listing shipments:', err);
        res.status(500).send('Internal Server Error');
    }
}

// Create a shipment
async function createShipment(req, res) {
    try {
        const newShipment = req.body;
        const db = await connectDB();
        const shipmentsCollection = db.collection('shipments');
        const result = await shipmentsCollection.insertOne(newShipment);
        res.status(201).json(result.ops[0]);
    } catch (err) {
        console.error('Error creating shipment:', err);
        res.status(400).send('Bad Request');
    }
}

// Retrieve a shipment
async function retrieveShipment(req, res) {
    try {
        const shipmentId = req.params.id;
        const db = await connectDB();
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

// Track a shipment
async function trackShipment(req, res) {
    try {
        const shipmentId = req.params.id;
        const db = await connectDB();
        const shipmentsCollection = db.collection('shipments');
        
        // Find the shipment by ID
        const shipment = await shipmentsCollection.findOne({ _id: ObjectId(shipmentId) });
        
        // Check if shipment exists
        if (!shipment) {
            res.status(404).send('Shipment not found');
            return;
        }
        
        // Check if shipment is available for tracking
        if (shipment.status !== 'shipped') {
            res.status(400).send('Shipment is not available for tracking');
            return;
        }
        
        // Fetch tracking information from shipment object
        const trackingInfo = shipment.trackingInfo;
        
        res.status(200).json(trackingInfo);
    } catch (error) {
        console.error('Error tracking shipment:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    listShipments,
    createShipment,
    retrieveShipment,
    trackShipment
};
