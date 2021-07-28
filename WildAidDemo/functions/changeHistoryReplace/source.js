exports = function(change) {

  const mongodb = context.services.get("mongodb-atlas");
  const history = mongodb.db('ofish').collection('ChangeHistory');
  
  const ObjID = change.fullDocument._id;
  const replaceObj = {
    changeType: 'REPLACE',
    date_created: new Date(),
    newDocument: change.fullDocument
  }

  delete replaceObj.rootID;
  
  return history.updateOne({_id: ObjID}, {"$push": { changeEvents: replaceObj}},  { "upsert": true }).then(record => {
     console.log(`Replaced change history for ${ObjID}`);
   }); 
}
  
