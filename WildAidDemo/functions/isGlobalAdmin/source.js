exports = function(emailAddress){
  // console.log(EJSON.stringify(user));
  // console.log(`Number of identities: ${user.identities.length}`);
  // emailAddress = user.data.email;
  console.log(`Checking email address: ${emailAddress}`);
  var userCollection = context.services.get("mongodb-atlas")
    .db("wildaid").collection("User");
  
  return userCollection.findOne({email: emailAddress})
  .then ( userDoc => { 
    console.log(`${emailAddress} is a global admin? - ${userDoc.global && userDoc.global.admin}`);
    return (userDoc.global && userDoc.global.admin);
  }).catch( e => { console.log(e); return false; }); 
};
