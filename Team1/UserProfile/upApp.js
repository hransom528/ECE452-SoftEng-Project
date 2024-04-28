document.addEventListener('DOMContentLoaded', function() {
    populateUserProfile(); // Call this function on load to fetch and display user data
});

async function populateUserProfile() {
    const accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
        console.log('No access token found');
        return;
    }

    const response = await fetch('/get-user-profile', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        console.error('Failed to fetch user profile:', response.statusText);
        return;
    }

    const userProfile = await response.json();
    document.getElementById('name').value = userProfile.name;
    document.getElementById('email').value = userProfile.email;
    document.getElementById('isPremium').checked = userProfile.isPremium;

    // Assuming shippingAddresses is an array of address objects
    userProfile.shippingAddresses.forEach(address => {
        // Append each address to a container or handle as needed
        console.log('Address:', address);
    });

    // Similar handling for shoppingCart, watchlist, orderHistory, and reviews
}

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
