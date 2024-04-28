// Get the form and result message elements
const reviewForm = document.getElementById('reviewForm');
const resultMessage = document.getElementById('resultMessage');

// Handle form submission
reviewForm.addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent form from submitting the usual way

    // Gather form data
    const formData = {
        userId: reviewForm.userId.value,
        productId: reviewForm.productId.value,
        title: reviewForm.title.value,
        rating: reviewForm.rating.value,
        review: reviewForm.review.value
    };

    // Make a POST request to the server
    fetch('http://localhost:3000/reviewProduct', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        // Display a success or error message
        if (data.success) {
            resultMessage.textContent = 'Review submitted successfully!';
            resultMessage.style.color = 'green';
        } else {
            resultMessage.textContent = 'Error: ' + data.message;
            resultMessage.style.color = 'red';
        }
    })
    .catch(error => {
        resultMessage.textContent = 'Error: ' + error.message;
        resultMessage.style.color = 'red';
    });
});
