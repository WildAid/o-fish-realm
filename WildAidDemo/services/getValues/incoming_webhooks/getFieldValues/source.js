exports = async function(payload) {
    
    const arg = payload.query.arg;
    
    let searchField = "$" + arg;
    console.log(searchField);

    const reports = context.services.get("mongodb-atlas").db("wildaid").collection("ContactReport");
  
  let resultsArray = await reports.aggregate([{
      $group: {
        '_id': searchField
        }
    }]).toArray();
    
    console.log("Number of array elements: " + resultsArray.length);
    
   return resultsArray.map(n => n._id);
  

};