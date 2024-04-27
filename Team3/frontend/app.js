document.getElementById('addUpdateField').addEventListener('click', function() {
    const updateFieldsContainer = document.getElementById('updateFieldsContainer');
    const newFieldDiv = document.createElement('div');
    newFieldDiv.classList.add('update-field');
    
    newFieldDiv.innerHTML = `
        <input type="text" class="update-key" placeholder="Field to update">
        <input type="text" class="update-value" placeholder="New value">
        <button type="button" class="remove-update-field">Remove</button>
    `;
    
    const removeButton = newFieldDiv.querySelector('.remove-update-field');
    removeButton.addEventListener('click', function() {
        newFieldDiv.remove();
    });
    
    updateFieldsContainer.appendChild(newFieldDiv);
});
document.querySelectorAll('.update-field').forEach(fieldDiv => {
    const key = fieldDiv.querySelector('.update-key').value.trim();
    let value = fieldDiv.querySelector('.update-value').value.trim();

    // Check if value is a number and convert it
    if (!isNaN(value) && value !== '') {
        value = parseFloat(value); // Convert to a floating-point number
    }
    if (key) {
        updateFields[key] = value;
    }
});
document.getElementById('deleteProductsButton').addEventListener('click', function() {
    const productIdsInput = document.getElementById('deleteProductIds').value;
    const productIds = productIdsInput.split(',').map(id => id.trim());

    fetch('http://localhost:3000/delete-listings', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds })
    })
    .then(response => response.json())
    .then(data => {
        if (data.result.every(res => res.success)) {
            displayResponse('Delete operation successful!');
        } else {
            displayResponse('Some deletions may not have been successful.', false);
        }
    })
    .catch(error => {
        displayResponse('Error deleting products: ' + error.message, false);
    });
});

document.getElementById('updateForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const productIdsInput = document.getElementById('productIds').value;
    const productIds = productIdsInput ? productIdsInput.split(',').map(id => id.trim()) : [];
    const updateFields = {};
    
    document.querySelectorAll('.update-field').forEach(fieldDiv => {
        const key = fieldDiv.querySelector('.update-key').value.trim();
        const value = fieldDiv.querySelector('.update-value').value.trim();
        if (key && value) {
            updateFields[key] = value;
        }
    });

    const removeFieldsInput = document.getElementById('removeFields').value;
    const unsetFields = removeFieldsInput ? removeFieldsInput.split(',').map(field => field.trim()) : [];
    
    const payload = {
        productIds,
        updateFields,
        unsetFields
    };

    fetch('http://localhost:3000/update-listings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Simplify the success message for the user
        if (data.result.every(update => update.success)) {
            document.getElementById('responseArea').textContent = 'Update is successful!';
            document.getElementById('responseArea').style.color = 'green';
        } else {
            document.getElementById('responseArea').textContent = 'Some updates may not have been successful. Please check the logs.';
            document.getElementById('responseArea').style.color = 'red';
        }
    })    
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('responseArea').textContent = 'Error updating products: ' + error.message;
    });
});
function displayResponse(message, isSuccess = true) {
    const responseArea = document.getElementById('responseArea');
    responseArea.textContent = message;
    responseArea.style.color = isSuccess ? 'green' : 'red';
}
