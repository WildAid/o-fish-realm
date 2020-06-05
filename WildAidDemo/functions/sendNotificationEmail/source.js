exports = function(subject, body){

  const fromAddress = context.values.get("sourceEmailAddress");
  const destAddress = context.values.get("destinationEmailAddress");
  const awsRegion = context.values.get("awsRegion");
  const ses = context.services.get('AWS').ses(awsRegion); 

  ses.SendEmail({
    Source: fromAddress,
    Destination: { ToAddresses: [destAddress] },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: body
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject
      }
    }
  })
  .then (result => {
    console.log(EJSON.stringify(result));
    return result;
  }), (error => {
    console.error(EJSON.stringify(error));
  });
};