require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig.js');

const mongoURI = process.env.MONGO_URI;

// Function to connect to MongoDB
async function connectToMongo() {
    try {
        if (!mongoURI) {
            throw new Error('MongoDB URI is not provided');
        }

        const client = await MongoClient.connect(mongoURI);
        const db = client.db();
        return db;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw new Error('Failed to connect to MongoDB');
    }
}

// Function to verify address
async function verifyAddress(address) {
    try {
        if (!address || typeof address !== 'object') {
            throw new Error('Invalid address object');
        }

        const isValid = true; 

        return { ...address, isValid };
    } catch (error) {
        console.error('Error verifying address:', error);
        throw new Error('Failed to verify address');
    }
}

// Function to standardize address
async function standardizeAddress(address) {
    try {
        if (!address || typeof address !== 'object') {
            throw new Error('Invalid address object');
        }

        const standardizedAddress = {
            ...address,
            streetAddress: address.streetAddress.toUpperCase(),
            city: address.city.toUpperCase(),
            State: address.State.toUpperCase()
        };

        return standardizedAddress;
    } catch (error) {
        console.error('Error standardizing address:', error);
        throw new Error('Failed to standardize address');
    }
}

// Function to geocode address
async function geocodeAddress(address) {
    try {
        if (!address || typeof address !== 'object') {
            throw new Error('Invalid address object');
        }

        const latitude = 0; 
        const longitude = 0; 

        return { latitude, longitude };
    } catch (error) {
        console.error('Error geocoding address:', error);
        throw new Error('Failed to geocode address');
    }
}

// Function to extract address components
async function extractAddressComponents(address) {
    try {
        if (!address || typeof address !== 'object') {
            throw new Error('Invalid address object');
        }

        const addressComponents = {
            streetAddress: address.streetAddress,
            city: address.city,
            State: address.State,
            postalCode: address.postalCode
        };

        return addressComponents;
    } catch (error) {
        console.error('Error extracting address components:', error);
        throw new Error('Failed to extract address components');
    }
}

// Function to check address completeness
async function checkAddressCompleteness(address) {
    try {
        if (!address || typeof address !== 'object') {
            throw new Error('Invalid address object');
        }

        // Check if all required address fields are present
        const isComplete = !!(
            address.streetAddress &&
            address.city &&
            address.State &&
            address.postalCode
        );

        return { isComplete };
    } catch (error) {
        console.error('Error checking address completeness:', error);
        throw new Error('Failed to check address completeness');
    }
}

// Function to retrieve address history
async function retrieveAddressHistory(addressId) {
    try {
        if (!addressId || typeof addressId !== 'string') {
            throw new Error('Invalid address ID');
        }

        const db = await connectToMongo();
        const addressHistory = await db.collection('address_history').find({ addressID: addressId }).toArray();

        return addressHistory;
    } catch (error) {
        console.error('Error retrieving address history:', error);
        throw new Error('Failed to retrieve address history');
    }
}

module.exports = {
    verifyAddress,
    standardizeAddress,
    geocodeAddress,
    extractAddressComponents,
    checkAddressCompleteness,
    retrieveAddressHistory
};
