exports = function(change) {

  const mongodb = context.services.get("mongodb-atlas");
  const history = mongodb.db('wildaid').collection('ChangeHistory');

  const ObjID = change.documentKey._id;
  const deleteObj = {
    _id : ObjID,
    changeType : 'DELETE',
    date_created : new Date()
  };
  
  return history.updateOne({_id: ObjID}, {"$push": { changeEvents: deleteObj}},  { "upsert": false }).then(record => {
    console.log(`Found matching Report document for ${ObjID} and deleted it.`);       
  }); 
}
  