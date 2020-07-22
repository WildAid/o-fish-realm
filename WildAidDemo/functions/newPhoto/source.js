exports = function(changeEvent){
  const fullDocument = changeEvent.fullDocument;
  const image = fullDocument.picture;
  const agency = fullDocument.agency;
  const id = fullDocument._id;
  const imageName = `${id}`;
  
  if (typeof image !== 'undefined') {
    console.log(`Requesting upload of image: ${imageName}`);
    context.functions.execute("uploadImageToS3", imageName, image)
    .then (() => {
      console.log('Uploaded to S3');
      const bucketName = context.values.get("photoBucket");
      const imageLink = `https://${bucketName}.s3.amazonaws.com/${imageName}`;
      const collection = context.services.get('mongodb-atlas').db("wildaid").collection("Photo");
      collection.updateOne({"_id": fullDocument._id}, {$set: {"pictureURL": imageLink}, $unset: {picture: null}});
    },
    (error) => {
      console.error(`Failed to upload image to S3: ${error}`);
    });
  } else {
    console.log("No new photo to upload this time");
  }
};
