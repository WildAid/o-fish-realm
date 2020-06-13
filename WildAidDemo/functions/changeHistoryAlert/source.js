exports = function(changeEvent) {
  /*
    A Database Trigger will always call a function with a changeEvent.
    Documentation on ChangeEvents: https://docs.mongodb.com/manual/reference/change-events/

    Access the _id of the changed document:
    const docId = changeEvent.documentKey._id;

    Access the latest version of the changed document
    (with Full Document enabled for Insert, Update, and Replace operations):
    const fullDocument = changeEvent.fullDocument;

    const updateDescription = changeEvent.updateDescription;

    See which fields were changed (if any):
    if (updateDescription) {
      const updatedFields = updateDescription.updatedFields; // A document containing updated fields
    }

    See which fields were removed (if any):
    if (updateDescription) {
      const removedFields = updateDescription.removedFields; // An array of removed fields
    }

    Functions run by Triggers are run as System users and have full access to Services, Functions, and MongoDB Data.

    Access a mongodb service:
    const collection = context.services.get(<SERVICE_NAME>).db("db_name").collection("coll_name");
    const doc = collection.findOne({ name: "mongodb" });

    Note: In Atlas Triggers, the service name is defaulted to the cluster name.

    Call other named functions if they are defined in your application:
    const result = context.functions.execute("function_name", arg1, arg2);

    Access the default http client and execute a GET request:
    const response = context.http.get({ url: <URL> })

    Learn more about http client here: https://docs.mongodb.com/stitch/functions/context/#context-http
  */

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
