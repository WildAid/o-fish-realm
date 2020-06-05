exports = function(changeEvent) {

  const operationType = changeEvent.operationType;
  const docId = changeEvent.documentKey._id;
  console.log(`ChangeHistory ${operationType}. ChangeHistory id: ${docId}`);

  const totalChangeHistoryCheckSum = context.functions.execute("hash", changeEvent.fullDocument);
  const thisChangeCheckSum = context.functions.execute("hash", changeEvent.updateDescription);
  
  const emailSubject = `WildAid - Latest change history for boarding report ID: ${docId}`;
  const emailBody = `
  <html>
  <body>
  <p>
    New change to boarding report id: ${docId}. MD5 Checksum for full change history = ${totalChangeHistoryCheckSum}.
  </p>
  <p>
  MD5 Checksum for full change history = ${totalChangeHistoryCheckSum}.
  </p>
  <p>
  MD5 Checksum for this change = ${thisChangeCheckSum}.
  </p>
  <p>
    New version of the report history (CS: ${totalChangeHistoryCheckSum}):
  </p>
  <pre>
    ${JSON.stringify(changeEvent.fullDocument, null, 4)}
  </pre>
  <p>
    Summary of this change (CS: ${thisChangeCheckSum}):
  </p>
  <pre>
    ${JSON.stringify(changeEvent.updateDescription, null, 4)}
  </pre>
  <p>
    Best Regards, WildAid.
  </p>
  </body>
  </html>
  `
  console.log("Sending email");
  context.functions.execute("sendNotificationEmail", emailSubject, emailBody);
};
