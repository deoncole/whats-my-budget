// establish a connection to indexedDB by creating a variable to hold the connection
let db;
// create a variable to act as teh event listener that will establish a connection to the database with a name and a version within the open()
const request = indexedDB.open('my_budget', 1);

// set an event to store the data in the object store for when the database needs to be upgraded
request.onupgradeneeded = function(event){
    const db = event.target.result;
    db.createObjectStore('new_budget', {autoIncrement: true});
};

// when the dtabase id successfully created
request.onsuccess = function(event){
    // save it to the global db variable upon success
    db = event.target.result;
    // check if the app has online connection, if so send the data stored in the local database to the api
    if(navigator.onLine){
        uploadBudget();
    }
};

// if there is an error with interacting with the database
request.onerror = function(event){
    console.log(event.target.errorCode);
};

// function to run if the new data is sent and there's no internet connection
function saveRecord(data){
    // open a new transaction(temporary connection) with the database to read and write to 
    const transaction = db.transaction(['new_budget'], 'readwrite');
    // access the object sore for the new budget
    const budgetObjectStore = transaction.objectStore('new_budget');
    // add the data to the object store
    budgetObjectStore.add(data)
};

// function to load the data with there is a internet connection
function uploadBudget(){
    // open a transaction to the database
    const transaction = db.transaction(['new_budget'], 'readwrite');
    // access the object store
    const budgetObjectStore = transaction.objectStore('new_budget');
    // get all of the data from the object store
    const getObjectStoreData = budgetObjectStore.getAll();

    getObjectStoreData.onsuccess = function(){
        // if there is data in teh object store send it to the api
        if(getObjectStoreData.result.length > 0){
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getObjectStoreData.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message){
                    throw new Error(serverResponse)
                }
                // open another transaction
                const transaction = db.transaction(['new_budget'], 'readwrite');
                // access a new object store
                const budgetObjectStore = transaction.objectStore('new_budget');
                // clear out the items in the object store
                budgetObjectStore.clear();
                // alert the user that all of the data has been saved with the connection back up and running
                alert('Connected to the internet and saved all transactions');  
            })
            .catch(err => {
                console.log(err)
            });
        }
    };
};

// when the app comes back online use an eventListener for the window
window.addEventListener('online', uploadBudget);