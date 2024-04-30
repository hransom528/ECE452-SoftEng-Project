//search function items
const searchInput = document.querySelector('.input');
const searchButton = document.getElementById('search-button');
const clearButton = document.getElementById('clear');
let searchResults=[]
let results = [];
let searchString = searchInput.value;

//filter function items
const filterForm = document.getElementById('filter-form');
let filterResults= [];

searchInput.addEventListener("input", (e) => {
    searchString = e.target.value;
    fetchData();

    // TODO: Perform autocomplete
});

searchInput.addEventListener("input", (e) => {
    searchString = e.target.value;
    fetchData();

    // TODO: Perform autocomplete
});

searchButton.addEventListener("click", () => {
    clearList();
    setList(searchResults,filterResults); 
});

clearButton.addEventListener("click", () => {
    // 1. write a function that removes any previous results from the page
    clearList();
});

async function fetchData() {
    // inside, we will need to achieve a few things:

    // 1. declare and assign the value of the event's target to a variable AKA whatever is typed in the search bar
    let value = searchString;
    // 2. check: if input exists and if input is larger than 0
    if (value && value.trim().length > 0){
        // 3. redefine 'value' to exclude white space and change input to all lowercase
         value = sanitize(value.trim().toLowerCase());
        // 4. return the results only if the value of the search is included in the person's name
        
        // Call MongoDB function to search for products
        fetch("http://localhost:3000/searchProducts", {
            method: "POST",
            body: JSON.stringify({
                query: value
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
        .then((response) => response.json())
        .then((json) => {
            searchResults = json.data;;
        });

    } else {
        // 5. return nothing
        // input is invalid -- show an error message or show no results
        //clearList();
    }
};

function filterProducts(){

    // Gather form data
    const formData = {
        brand: filterForm.brand.value,
        type: filterForm.type.value,
    };
    
    for (const property in formData) {
        if(formData[property].trim()==""){
            delete formData[property]
        }
    }

    let filterBody=JSON.stringify(formData)
   
    fetch("http://localhost:3000/filterCatalog", {
            method: "POST",
            body: filterBody,
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
        .then((response) => response.json())
        .then((json) => {
            filterResults=json.data
        });
};

// creating and declaring a function called "setList"
// setList takes in a param of "results"
function setList(searchResults,filterResults) {

    //NEED TO MAKE THIS AWAIT
    filterProducts();
    results = searchResults.filter(value => filterResults.includes(value.name));
    

    for (const result of results) {
        // creating a li element for each result item
        const resultItem = document.createElement('li')

        // adding a class to each item of the results
        resultItem.classList.add('result-item')

        // grabbing the name of the current point of the loop and adding the name as the list item's text
        const text = document.createTextNode(result.name)

        // appending the text to the result item
        resultItem.appendChild(text)

        // appending the result item to the list
        list.appendChild(resultItem)
    }

    if (results.length === 0) {
        noResults()
    }
}

// Clears search results list
function clearList() {
    // looping through each child of the search results list and remove each child
    while (list.firstChild) {
        list.removeChild(list.firstChild)
    }
}

// Displays error message when no results are found
function noResults() {
    // create an element for the error; a list item ("li")
    const error = document.createElement('li')
    // adding a class name of "error-message" to our error element
    error.classList.add('error-message')

    // creating text for our element
    const text = document.createTextNode('No results found. Sorry!')
    // appending the text to our element
    error.appendChild(text)
    // appending the error to our list element
    list.appendChild(error)
}

// Performs input sanitization on user search
function sanitize(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, (match)=>(map[match]));
  }
