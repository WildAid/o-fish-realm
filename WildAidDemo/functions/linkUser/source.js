exports = function(authEvent) {
  const userCollection = context.services.get("mongodb-atlas").db("wildaid").collection("User");
  const email = authEvent.user.data.email
  userCollection.updateOne({email: email}, {$set: {realmUserID: authEvent.user.id}})
    .then (() => {
      console.log(`Set realmUserID to ${authEvent.user.id} in User document for ${email}.`);
      userCollection.findOne({email: email})
      .then (userDoc => {
        if (userDoc) {
          if (!userDoc.profilePic || userDoc.profilePic === "") {
            const photoURL = context.values.get("defaultHeadshotImageURL")
            console.log(`Setting profilePic for ${email} to ${photoURL}`)
            const photoCollection = context.services.get("mongodb-atlas").db("wildaid").collection("Photo");
            const photoDoc = {
              date: new Date(),
              agency: userDoc.agency? userDoc.agency.name : "",
              pictureURL: photoURL,
              referencingReportID: ""
            }
            photoCollection.insertOne(photoDoc)
            .then (result => {
              console.log(`Inserted Photo document`)
              userCollection.updateOne({_id: userDoc._id}, {$set: {profilePic: result.insertedId.toString()}})
              .then ((userResult) => {
                if (userResult.modifiedCount === 1) {
                  console.log(`Set profilePic to ${result.insertedId.toString()}`)
                } else {
                  console.log("Couldn't set the profile pic in the User document")
                }
              })
            }, error => {
              console.log(`Failed to insert new Photo doc: ${error}`)
            })
          }
        } else {
          console.log(`No User doc fount for ${email}`)
        }
      }, error => {
        console.log(`Attempt to find User doc for ${email} failed: ${error}`)
      })
    },
    (error) => {
      console.error(`Failed to update User document for ${email}: ${error}`);
    })
};