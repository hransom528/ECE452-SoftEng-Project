document.addEventListener('DOMContentLoaded', function() {
    const updateAddressForm = document.getElementById('updateAddressForm');

    // Handle Address Updates
    updateAddressForm.addEventListener('submit', function(event) {
        event.preventDefault();
        updateAddress();
    });

    // Handle Membership Management
    document.getElementById('manageMembership').addEventListener('click', function(event) {
        event.preventDefault();
        manageMembership();
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

    fetch('/update-address', {
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

function manageMembership() {
    fetch('/manage-membership', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error managing membership:', error));
}
