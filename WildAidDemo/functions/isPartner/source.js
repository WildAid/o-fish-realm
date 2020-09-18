exports = function(documentAgency, emailAddress){
  console.log(`Checking email address: ${emailAddress} for documentAgency: ${documentAgency}`);
  var database = context.services.get("mongodb-atlas").db("wildaid");
  var userCollection = database.collection("User");
  var agencyCollection = database.collection("Agency");
  
  return userCollection.findOne({email: emailAddress})
  .then ( userDoc => { 
    if (userDoc) {
      console.log('Found User document');
      return agencyCollection.findOne({name: documentAgency})
      .then (agencyDoc => {
        return agencyDoc.partnerAgencies.includes(userDoc.agency.name);
      }).catch( e => { console.log(`Failed to find Agency doc: ${e}`); return false; });
    } else {
      console.log('Failed to find User document');
      return false;
    }
  }).catch( e => { `Failed to find User doc: ${e}`; return false; }); 
};