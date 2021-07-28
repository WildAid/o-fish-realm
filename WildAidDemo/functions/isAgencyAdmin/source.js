exports = function(agency, emailAddress){
  console.log(`Checking email address: ${emailAddress} for agency: ${agency}`);
  var userCollection = context.services.get("mongodb-atlas")
    .db("ofish").collection("User");
  
  return userCollection.findOne({email: emailAddress, agency: {name: agency, admin: true}})
  .then ( userDoc => { 
    if (userDoc) {
      console.log('Matches Agency Admin rule');
      return (true);
    } else {
      return false;
    }
  }).catch( e => { console.log(e); return false; }); 
};
