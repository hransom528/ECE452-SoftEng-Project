// Get the form and result message elements
const reviewForm = document.getElementById('reviewForm');
const resultMessage = document.getElementById('resultMessage');
const submitButton = document.getElementById('submit-button');

async function makeRequest(url,path,_method,_contentType,_body){
    const response = await fetch(url+path, {
        method: _method,
        headers: {
            'Content-Type': _contentType
        },
        body: JSON.stringify(_body)
    }).then(r => r.json())
    .then(r => {
        console.log(r.message);
        if(r.message=="Review submitted successfully"){
            resultMessage.textContent = 'Review submitted successfully!';
            resultMessage.style.color = 'green';
           
        }else if(!r.error){
            resultMessage.textContent = r.message;
            resultMessage.style.color = 'red';
        } else{
                resultMessage.textContent = r.message +": "+ r.error;
                resultMessage.style.color = 'red';
        }
    }).catch(error => console.error('Error', error))
    
}

// Handle form submission
submitButton.addEventListener('click', function (e) {
    e.preventDefault(); // Prevent form from submitting the usual way

    // Gather form data
    const formData = {
        userid: reviewForm.userid.value,
        productId: reviewForm.productId.value,
        title: reviewForm.title.value,
        rating: reviewForm.rating.value,
        review: reviewForm.review.value
    };
    const review= makeRequest('http://localhost:3000','/Product_Review','POST','application.json',formData);
    //resultMessage.textContent = review;
    //console.log(review)

    // //.then(response => response.json())
    // .then(data => {
    //     // Display a success or error message
    //         resultMessage.textContent = 'Review submitted successfully!';
    //         resultMessage.style.color = 'green';
    // })
    // .catch(error => {
    //     resultMessage.textContent = 'Error: ' + error.message;
    //     resultMessage.style.color = 'red';
    // });
});
