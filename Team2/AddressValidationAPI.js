const { ObjectId } = require('mongodb');
const { connectDB } = require('../dbConfig');
const { promisify } = require('util');
const { createClient } = require('@google/maps');

// Initialize the Google Maps API client
const googleMapsClient = createClient({
  key: 'AIzaSyC4zBUWivZ9nJuCidSWFui1HGP2Huo7-7Q'
});


const geocodeAsync = promisify(googleMapsClient.geocode).bind(googleMapsClient);

async function getUser(userId) {

    const db = await connectDB();
    const collection = db.collection('users');

    const user = await collection.findOne({ _id: new ObjectId(userId) });

    return user;
}

async function verifyAddress(data) {
    try {
        // Extract address object from the data
        const address = data.address;


        if (!address || typeof address !== 'object') {
            throw new Error('Invalid address object');
        }

        // Convert the address object to a string
        const addressString = formatAddress(address);

        // Make a request to Google Maps Geocoding API to validate the address
        const response = await geocodeAsync({
            address: addressString
        });


        // Check if response is undefined or no results found
        if (!response || !response.json || !response.json.results || response.json.results.length === 0) {
            console.log('Invalid response or no results found');
            return "Address is incorrect. Please enter a valid address.";
        } else {
            // Check if the formatted address from the response matches the original address
            const formattedResponseAddress = formatAddress(response.json.results[0].formatted_address);
            console.log(formattedResponseAddress);
            const originalAddressString = formatAddress(address);
            console.log(originalAddressString);
            
            if (formattedResponseAddress !== originalAddressString) {
                console.log('Partial match found');
                return "Address is incorrect. Please enter a valid address.";

            } else {
                console.log('Exact match found');
                return "Address is correct.";

            }
        }

    } catch (error) {
        console.error('Error verifying address:', error);
        throw new Error('Failed to verify address', error);
    }
}

// Function to format the address object or string
function formatAddress(address) {
    if (typeof address === 'object') {
        const { street, city, state, postalCode, country } = address;
        return `${street}, ${city}, ${state} ${postalCode}, ${country}`;
    } else {
        return address;
    }
}
   

// Function to standardize address
async function standardizeAddress(address) {
    try {
        if (!address || typeof address !== 'object') {
            throw new Error('Invalid address object');
        }

        const standardizedAddress = {};

        // Check and standardize streetAddress if it exists
        if (address.streetAddress) {
            standardizedAddress.streetAddress = address.streetAddress.toUpperCase();
        }

        // Check and standardize city if it exists
        if (address.city) {
            standardizedAddress.city = address.city.toUpperCase();
        }

        // Check and standardize State if it exists
        if (address.State) {
            standardizedAddress.State = address.State.toUpperCase();
        }

        return standardizedAddress;
    } catch (error) {
        console.error('Error standardizing address:', error);
        throw new Error('Failed to standardize address');
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
// Function to get address ID
async function getAddressId(addressCriteria) {
    try {
        const db = await connectDB(); // Assuming connectDB returns the MongoDB client
        const address = await db.collection('shippingAddresses').findOne(addressCriteria);
        
        if (!address || !address._id) {
            throw new Error('Address not found for the given criteria');
        }
        
        return address._id.toString(); // Assuming address ID is stored as a string in MongoDB
    } catch (error) {
        console.error('Error getting address ID:', error);
        throw new Error('Failed to get address ID');
    }
}

// Function to retrieve address history
async function retrieveAddressHistory(userId, addressId) {
    try {
        // Connecting to the database
        const db = await connectDB();
        
        // Projection to include only desired fields
        const projection = {
            recipientName: 1,
            streetAddress: 1,
            city: 1,
            state: 1,
            postalCode: 1,
            country: 1,
            _id: 0 // Exclude _id field from the result
        };

        // Querying user document based on userId
        const user = await getUser(userId);
        
        if (!user) {
            console.log('User not found');
            return;
        }

        // Finding the address from the shippingAddresses array using addressId
        const address = user.shippingAddresses.find(addr => addr.addressId === addressId);

        if (!address) {
            console.log('Address not found');
            return;
        }

        // Return the address
        return address;
    } catch (error) {
        console.error('Error retrieving address history:', error);
        throw new Error('Failed to retrieve address history');
    }
}


module.exports = {
    verifyAddress,
    checkAddressCompleteness,
    retrieveAddressHistory
};
