// Get the form and result message elements
const reviewForm = document.getElementById('reviewForm');
const resultMessage = document.getElementById('resultMessage');

// Handle form submission
reviewForm.addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent form from submitting the usual way

    // Gather form data
    const formData = {
        userid: reviewForm.userid.value,
        productId: reviewForm.productId.value,
        title: reviewForm.title.value,
        rating: reviewForm.rating.value,
        review: reviewForm.review.value
    };

    // Make a POST request to the server
    fetch('http://localhost:3000/Product_Review', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        // Display a success or error message
     
            resultMessage.textContent = 'Review submitted successfully!';
            resultMessage.style.color = 'green';
        
    })
    .catch(error => {
        resultMessage.textContent = 'Error: ' + error.message;
        resultMessage.style.color = 'red';
    });
});
