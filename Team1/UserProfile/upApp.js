document.addEventListener('DOMContentLoaded', function() {
    populateUserProfile(); // Call this function on load to fetch and display user data
});

async function populateUserProfile() {
    const accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
        console.log('No access token found');
        return;
    }

    try {
        const response = await fetch('/get-user-profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const userProfile = await response.json();
            document.getElementById('name').value = userProfile.name;
            document.getElementById('email').value = userProfile.email;
            document.getElementById('isPremium').checked = userProfile.isPremium;
                    
            const defaultAddress = userProfile.shippingAddresses.find(address => address.isDefault);
            const additionalAddresses = userProfile.shippingAddresses.filter(address => !address.isDefault);
        
            renderDefaultAddress(defaultAddress);
            renderAdditionalAddresses(additionalAddresses);
        } else {
            console.error('Failed to fetch user profile:', response.statusText);
        }
            } catch (error) {
        console.error('Error fetching user profile:', error);
    }
        // Similar handling for shoppingCart, watchlist, orderHistory, and reviews
}


function renderDefaultAddress(address) {
    const defaultAddressContainer = document.getElementById('defaultAddressContainer');
    if (address) {
        defaultAddressContainer.innerHTML = getAddressHTML(address, true); // true to include the edit button
    } else {
        defaultAddressContainer.innerHTML = '<p>No default address set.</p>';
    }
}

// For the renderAdditionalAddresses function, ensure it's only called if additional addresses exist
function renderAdditionalAddresses(addresses) {
    const additionalAddressesContainer = document.getElementById('additionalAddressesContainer');
    if (addresses.length > 0) {
        additionalAddressesContainer.innerHTML = addresses.map(address => getAddressHTML(address, true)).join('');
    }
}

// Helper function to generate HTML for an address
function getAddressHTML(address, includeEditButton) {
    return `
        <div class="address" data-address-id="${address._id}">
            <p>Recipient: ${address.recipientName}</p>
            <p>Street: ${address.street}</p>
            <p>City: ${address.city}</p>
            <p>State: ${address.state}</p>
            <p>Postal Code: ${address.postalCode}</p>
            <p>Country: ${address.country}</p>
            <p>Default: ${address.isDefault ? 'Yes' : 'No'}</p>
            ${includeEditButton ? `<button onclick="editAddress('${address._id}')">Edit</button>` : ''}
            <button onclick="deleteAddress('${address._id}')">Delete</button>
        </div>
    `;
}

// Toggle the visibility of additional addresses
document.getElementById('toggleAddresses').addEventListener('click', function() {
    const additionalAddressesCsontainer = document.getElementById('additionalAddressesContainer');
    additionalAddressesContainer.style.display = additionalAddressesContainer.style.display === 'none' ? '' : 'none';
    this.textContent = additionalAddressesContainer.style.display === 'none' ? 'View Other Addresses' : 'Hide Other Addresses';
});

// Show form to add a new address
function showAddressForm() {
    document.getElementById('addressForm').style.display = 'block';
    document.getElementById('addAddress').style.display = 'none';
}

// This function will be triggered when the address form is submitted
document.getElementById('addressForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // Collect address details from the form
    const address = {
        recipientName: document.getElementById('recipientName').value,
        street: document.getElementById('street').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        postalCode: document.getElementById('postalCode').value,
        country: document.getElementById('country').value,
        isDefault: document.getElementById('isDefault').checked
    };

    const accessToken = sessionStorage.getItem('accessToken'); // Retrieve the access token
    if (!accessToken) {
        alert('You must be logged in to perform this action.');
        return;
    }

    // Make the API request to add the address
    fetch('/add-shipping-address', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(address)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Address added successfully') {
            alert('New address added successfully!');
            populateUserProfile(); // Reload the addresses on the page
        } else {
            alert('Failed to add address: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error adding new address:', error);
        alert('Failed to add address due to an error.');
    });
});

function updateAddress() {
    const recipientName = document.getElementById('recipientName').value;
    const street = document.getElementById('street').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const postalCode = document.getElementById('postalCode').value;
    const country = document.getElementById('country').value;
    const isDefault = document.getElementById('isDefault').checked;

    const addressDetails = { recipientName, street, city, state, postalCode, country, isDefault };

    fetch('/update-shipping-address', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(addressDetails)
    })
    .then(response => response.json())
    .then(data => {
        alert('Address Update Response: ' + data.message);
    })
    .catch(error => console.error('Error updating address:', error));
}

function purchaseMembership() {
    fetch('/purchase-premium-membership', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    })
    .catch(error => console.error('Error purchasing membership:', error));
}

function cancelMembership() {
    fetch('/cancel-premium-membership', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    })
    .catch(error => console.error('Error cancelling membership:', error));
}
