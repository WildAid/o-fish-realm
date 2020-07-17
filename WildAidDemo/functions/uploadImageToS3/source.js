exports = function(name, image) {
  const s3 = context.services.get('AWS').s3(context.values.get("awsRegion"));
  const bucket = context.values.get("photoBucket");
  console.log(`Bucket: ${bucket}`);
  return s3.PutObject({
    "Bucket": bucket,
    "Key": name,
    "ACL": "public-read",
    "ContentType": "image/jpeg",
    "Body": image
  });
};
