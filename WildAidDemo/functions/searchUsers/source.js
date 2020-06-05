exports = function(emailAddress){
 var userCollection = context.services.get("mongodb-atlas")
    .db("wildaid").collection("User");
  
  return userCollection.aggregate([
        {
          '$searchBeta': {
            'term': {
              'path': 'email', 
              'query': emailAddress, 
              'fuzzy': {
                'maxEdits': 2
              }
            }
          }
        }, {
          '$limit': 3
        }
      ]).toArray().then ( userDoc => { 
    if (userDoc) {
      return (userDoc);
    } else {
      return [];
    }
  }).catch( e => { console.log(e); return false; }); 
};