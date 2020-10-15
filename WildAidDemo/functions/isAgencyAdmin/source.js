exports = function(agency, emailAddress){
  console.log(`Checking email address: ${emailAddress} for agency: ${agency.name}`);
  var userCollection = context.services.get("mongodb-atlas")
    .db("wildaid").collection("User");
  
  return userCollection.findOne({email: emailAddress, agency: {name: agency.name, admin: true}})
  .then ( userDoc => { 
    if (userDoc) {
      console.log('Matches Agency Admin rule');
      return (true);
    } else {
      return false;
    }
  }).catch( e => { console.log(e); return false; }); 
};
