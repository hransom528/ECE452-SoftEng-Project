var stripe = Stripe('pk_test_51Ot8H8IYD2Ak4FLoPHpmVZsGQY9mtmlaJBqmDxQvuqi6HsM9oDkIal74YGlJDw0LuWqNxb8r1eD8cH1Q2yjGtvpW00crbHgrlB');
var cardElement;

document.addEventListener('DOMContentLoaded', function() {
    const elements = stripe.elements();
    cardElement = elements.create('card');
    cardElement.mount('#card-element');
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
            document.getElementById('isPremium').textContent = userProfile.isPremium ? "True" : "False";
                    
            const defaultAddress = userProfile.shippingAddresses.find(address => address.isDefault);
            const additionalAddresses = userProfile.shippingAddresses.filter(address => !address.isDefault);

            renderDefaultAddress(defaultAddress);
            renderAdditionalAddresses(additionalAddresses);

            // Get the membership management section element
            const membershipManagementSection = document.querySelector('.membership-management-section');

            // Conditional rendering based on the premium status
            if (userProfile.isPremium) {
                // User is a premium member; show only the cancel membership button
                membershipManagementSection.innerHTML = `
                    <h2>Membership Management</h2>
                    <button id="cancelMembership">Cancel Membership</button>
                `;
            } else {
                // User is not a premium member; show only the purchase membership button
                membershipManagementSection.innerHTML = `
                    <h2>Membership Management</h2>
                    <form id="cardForm">
                        <div id="card-element"><!-- Stripe will insert the card element here --></div>
                        <button id="purchaseMembership">Purchase Membership</button>
                    </form>
                `;
                // Re-mount Stripe elements after updating the DOM
                cardElement.mount('#card-element');
            }

            // Add event listeners for the buttons after they are rendered
            document.getElementById('cancelMembership')?.addEventListener('click', handleCancelMembership);
            document.getElementById('purchaseMembership')?.addEventListener('click', handlePurchaseMembership);

        } else {
            console.error('Failed to fetch user profile:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
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

// Function to generate HTML for an address, now using data attributes
function getAddressHTML(address, includeEditButton) {
    // Ensure each attribute is safely encoded to avoid HTML injection issues
    const safeHtml = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    
    return `
        <div class="address" data-address-id="${safeHtml(address.addressId)}" 
                             data-recipient-name="${safeHtml(address.recipientName)}" 
                             data-street="${safeHtml(address.street)}" 
                             data-city="${safeHtml(address.city)}" 
                             data-state="${safeHtml(address.state)}" 
                             data-postal-code="${safeHtml(address.postalCode)}" 
                             data-country="${safeHtml(address.country)}" 
                             data-is-default="${safeHtml(address.isDefault)}">
            <p>Recipient: <span>${safeHtml(address.recipientName)}</span></p>
            <p>Street: <span>${safeHtml(address.street)}</span></p>
            <p>City: <span>${safeHtml(address.city)}</span></p>
            <p>State: <span>${safeHtml(address.state)}</span></p>
            <p>Postal Code: <span>${safeHtml(address.postalCode)}</span></p>
            <p>Country: <span>${safeHtml(address.country)}</span></p>
            <p>Default: <span>${address.isDefault ? 'Yes' : 'No'}</span></p>
            ${includeEditButton ? `<button type="button" onclick="editAddress('${safeHtml(address.addressId)}')">Edit</button>` : ''}
        </div>
    `;
}

function editAddress(addressId) {
    console.log("Edit Address ID:", addressId);
    const addressDiv = document.querySelector(`div[data-address-id="${addressId}"]`);
    if (!addressDiv) {
        console.error("Failed to find address div for ID:", addressId);
        return;
    }

    // Store the current HTML before editing
    const currentHTML = addressDiv.innerHTML;

    // Hide the current display and show the editing form
    addressDiv.style.display = 'none';

    // Create an editing form and insert it next to the hidden address div
    const formHTML = `
        <div id="editForm_${addressId}">
            <form onsubmit="saveEditedAddress(event, '${addressId}')">
                <input type="text" id="editRecipientName_${addressId}" value="${addressDiv.getAttribute('data-recipient-name')}" placeholder="Recipient Name">
                <input type="text" id="editStreet_${addressId}" value="${addressDiv.getAttribute('data-street')}" placeholder="Street">
                <input type="text" id="editCity_${addressId}" value="${addressDiv.getAttribute('data-city')}" placeholder="City">
                <input type="text" id="editState_${addressId}" value="${addressDiv.getAttribute('data-state')}" placeholder="State">
                <input type="text" id="editPostalCode_${addressId}" value="${addressDiv.getAttribute('data-postal-code')}" placeholder="Postal Code">
                <input type="text" id="editCountry_${addressId}" value="${addressDiv.getAttribute('data-country')}" placeholder="Country">
                <label>Set as Default:
                    <input type="checkbox" id="editIsDefault_${addressId}" ${addressDiv.getAttribute('data-is-default') === 'true' ? 'checked' : ''}>
                </label>
                <button type="submit">Save</button>
                <button type="button" onclick="cancelEdit('${addressId}')">Cancel</button>
                <button type="button" onclick="deleteAddress('${addressId}')">Delete</button>
            </form>
        </div>
    `;
    addressDiv.insertAdjacentHTML('afterend', formHTML);
}

// Function to cancel editing and revert back to the original display
function cancelEdit(addressId) {
    const editForm = document.getElementById(`editForm_${addressId}`);
    const addressDiv = document.querySelector(`div[data-address-id="${addressId}"]`);

    // Remove the form and show the original data
    if (editForm) {
        editForm.remove();
    }
    if (addressDiv) {
        addressDiv.style.display = '';
    } else {
        console.error("Failed to find address div for ID:", addressId);
    }
}

// Function to save edited address from the form
function saveEditedAddress(event, addressId) {
    event.preventDefault();
    console.log("Saving Address ID:", addressId);  // Verify the addressId at save

    const addressDetails = {
        recipientName: document.getElementById(`editRecipientName_${addressId}`).value,
        street: document.getElementById(`editStreet_${addressId}`).value,
        city: document.getElementById(`editCity_${addressId}`).value,
        state: document.getElementById(`editState_${addressId}`).value,
        postalCode: document.getElementById(`editPostalCode_${addressId}`).value,
        country: document.getElementById(`editCountry_${addressId}`).value,
        isDefault: document.getElementById(`editIsDefault_${addressId}`).checked
    };

    console.log("Address Details:", addressDetails); // Log the address details

    updateAddress(addressId, addressDetails);  // Ensure updateAddress is called with the correct ID
}

async function updateAddress(addressId, updatedAddress) {
    const accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
        console.log('No access token found');
        return;
    }

    try {
        const response = await fetch('/update-shipping-address', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ addressId, updatedAddress })
        });

        const data = await response.json(); // Parse JSON response

        if (response.ok) {
            alert(data.message); // Display success message
            populateUserProfile(); // Refresh the user profile after updating the address
        } else {
            console.error('Failed to update address:', data.message);
            alert('Failed to update address: ' + data.message); // Display error message from server
        }
    } catch (error) {
        console.error('Error updating address:', error);
        alert('Failed to update address due to an error.'); // Fallback error message
    }
}

// Function to delete an address with specific ID
function deleteAddress(addressId) {
    if (confirm('Are you sure you want to delete this address? This action cannot be undone.')) {
        const accessToken = sessionStorage.getItem('accessToken');
        if (!accessToken) {
            alert('You must be logged in to perform this action.');
            return;
        }

        fetch('/delete-shipping-address', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ addressId: addressId }) // Ensure the addressId is correctly sent to the server
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Address deleted successfully.');
                populateUserProfile(); // Refresh the user profile
            } else {
                alert('Failed to delete address: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error deleting address:', error);
            alert('Failed to delete address due to an error.');
        });
    }
}

// Toggle the visibility of additional addresses
document.getElementById('toggleAddresses').addEventListener('click', function() {
    const additionalAddressesContainer = document.getElementById('additionalAddressesContainer');
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
    const addressId = this.dataset.editingAddressId; // Check if we are editing
    createAddress(addressId); // Function to handle both create and update
});

// Function to handle creating a new address
function createAddress() {
    const addressDetails = {
        recipientName: document.getElementById('recipientName').value,
        street: document.getElementById('street').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        postalCode: document.getElementById('postalCode').value,
        country: document.getElementById('country').value,
        isDefault: document.getElementById('isDefault').checked
    };

    const accessToken = sessionStorage.getItem('accessToken');
    fetch('/add-shipping-address', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(addressDetails)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Address added successfully') {
            alert(data.message);
            clearAndHideAddressForm(); // Clear the form fields and hide the form
            populateUserProfile(); // Refresh the addresses
        } else {
            alert('Failed to add address: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error adding address:', error);
        alert('Failed to add address due to an error.');
    });
}

// Function to clear and hide the address form
function clearAndHideAddressForm() {
    document.getElementById('addressForm').style.display = 'none';
    document.getElementById('addAddress').style.display = 'block';
    document.getElementById('addressForm').reset(); // Reset form fields to initial values
}

// Function for cancel button in add address form
function cancelAddAddress() {
    clearAndHideAddressForm();
}

document.getElementById('cancelAddress').addEventListener('click', cancelAddAddress);


document.getElementById('cardForm').addEventListener('submit', function(event) {
    event.preventDefault();
    handlePurchaseMembership();
});

function handlePurchaseMembership() {
    const accessToken = sessionStorage.getItem('accessToken');
    const stripeToken = 'tok_visa'; // Note: This should be retrieved dynamically after Stripe Element handling.

    console.log('Sending purchase request');

    fetch('/purchase-premium-membership', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stripeToken: stripeToken })
    })
    .then(response => response.json()) // Ensure this is parsing correctly.
    .then(data => {
        console.log('Response data:', data);
        if (data.success) {
            alert('Membership purchase successful!');
            populateUserProfile(); // Refresh user data to reflect changes.
        } else {
            alert('Failed to purchase membership: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error purchasing membership:', error);
        alert('Failed to purchase membership due to an error.');
    });
}

function handleCancelMembership() {
    const accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
        alert('You need to be logged in to cancel your membership.');
        return;
    }

    fetch('/cancel-premium-membership', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Membership cancelled successfully.');
            populateUserProfile(); // Refresh user profile to update UI
        } else {
            alert('Failed to cancel membership: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error cancelling membership:', error);
        alert('Failed to cancel membership due to an error.');
    });
}

document.getElementById('deleteProfile').addEventListener('click', function() {
    if (confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
        fetch('/delete-user-profile', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.success) {
                window.location.href = '/Reg_lgn/home/home.html'; // Redirect to home page
            }
        })
        .catch(error => {
            console.error('Failed to delete profile:', error);
            alert('Failed to delete profile.');
        });
    }
});
