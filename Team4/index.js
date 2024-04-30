//search function items
const searchInput = document.querySelector('.input');
const searchButton = document.getElementById('search-button');
const clearButton = document.getElementById('clear');
let searchResults=[]
let results = [];
let searchString = searchInput.value;

//filter function items
const filterForm = document.getElementById('filter-form');
let filterBody=[];
let filterResults= [];

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

async function filterProducts(){
    // Gather form data
    const formData = {
        brand: filterForm.brand.value,
        type: filterForm.type.value,
    };
    
    //delete empty properties
    for (const property in formData) {
        if(formData[property].trim()==""){
            delete formData[property]
        }
    }
    //update global form data 
    filterBody=formData;

    //perform filtering, and update global filtered list
    fetch("http://localhost:3000/filterCatalog", {
            method: "POST",
            body: JSON.stringify(filterBody),
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
    
    filterProducts(); //need to Add Await to this
    results = searchResults.filter(value => filterResults.includes(value.name));
    
    //set results list
    if (results.length === 0) {        //if there is no overlap in search and filters, check following
        if(Object.keys(filterBody).length<1){ //if no filter is applied, then there are no results
            noResults();
        } else if(searchString.length<1){ //if a filter is applied, and the search bar is empty, search only using filters
            for (const result of filterResults) {
                // creating a li element for each result item
                const resultItem = document.createElement('li')
    
                // adding a class to each item of the results
                resultItem.classList.add('result-item')
    
                // grabbing the name of the current point of the loop and adding the name as the list item's text
                const text = document.createTextNode(result)
    
                // appending the text to the result item
                resultItem.appendChild(text)
    
                // appending the result item to the list
                list.appendChild(resultItem)
            }
        }
    } else{ //if search is applied and meet filter requirements, return results
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
