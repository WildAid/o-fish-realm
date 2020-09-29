/*
  This is used to create `Agency` and `User` Atlas documents to enable a (web) developer to
  create a new agency for experimenting with the O-FISH front-end apps with a shared, O-FISH
  backend Realm app.
  
  This functionality should not be used in a production environment, and only works if 
  Anononymous Authentication is enabled for this Realm app.
  
  Returns:
    result: "success" or "error"
    reason: Error nessage if result is "error"
*/
exports = function(firstName, lastName, email, agencyName, agencyURL) {
  console.log(`Attempting to create Agency & User documents for user ${email} and agency ${agencyName}`);
  
  const developerMode = context.values.get("developerMode");
  if (!developerMode) {
    const errorText = `developerMode not enabled in backend Realm app`;
      console.log(errorText);
      return {result: "error", reason: errorText};
  }
  
  var database = context.services.get("mongodb-atlas").db("wildaid");
  var userCollection = database.collection("User");
  var agencyCollection = database.collection("Agency");
 
  return userCollection.findOne({email: email})
  .then ( userDoc => {
    if (userDoc) {
      const errorText = `User document already exists for ${email}`;
      console.log(errorText);
      return {result: "error", reason: errorText};
    } else {
      return agencyCollection.findOne({name: agencyName})
      .then ( agencyDoc => {
        if (agencyDoc) {
          const errorText = `Agency document already exists for ${agencyName}`;
          console.log(errorText);
          return {result: "error", reason: errorText};
        } else {
          return agencyCollection.insertOne({
            active: true,
            name: agencyName,
            description: `Development agency for ${email}`,
            email: email,
            site: agencyURL
          })
          .then ( _ => {
            return userCollection.insertOne({
              agency: {name: agencyName, admin: true},
              createdOn: new Date(),
              email: email,
              global: {admin: false},
              name: {first: firstName, last: lastName}
            })
            .then (_ => {
              console.log(`Added new new User document for ${email}`);
              return {result: "success", reason: ""};
            }, error => {
              const errorText = `Failed to add new User doc: ${e}`;
              console.log(errorText);
              return {result: "error", reason: errorText};
            })
          }, error => {
            const errorText = `Failed to add new Agency doc: ${e}`;
            console.log(errorText);
            return {result: "error", reason: errorText};
          }
        )}
      }, error => {
        const errorText = `DB access failed trying to find Agency doc: ${e}`;
        console.log(errorText);
        return {result: "error", reason: errorText};
      })
    }
  }, error => {
    const errorText = `DB access failed trying to find User doc: ${e}`;
    console.log(errorText);
    return {result: "error", reason: errorText};
  })
};