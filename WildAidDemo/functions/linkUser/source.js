exports = function(authEvent) {
  const userCollection = context.services.get("mongodb-atlas").db("wildaid").collection("User");
  userCollection.updateOne({email: authEvent.user.data.email}, {$set: {realmUserID: authEvent.user.id}})
    .then (() => {
      console.log(`Set realmUserID to ${authEvent.user.id} in User document for ${authEvent.user.data.email}.`);
    },
    (error) => {
      console.error(`Failed to update User document for ${authEvent.user.data.email}: ${error}`);
    })
};