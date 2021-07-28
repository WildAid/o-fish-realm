exports = function(change) {

  const mongodb = context.services.get("mongodb-atlas");
  const history = mongodb.db('ofish').collection('ChangeHistory');
  const ObjID = change.fullDocument._id;

 const updateObj = {
    changeType: 'UPDATE',
    date_created: new Date(),
    updateDescription:change.updateDescription
  };

  return history.updateOne({_id: ObjID}, {"$push": { changeEvents: updateObj}},  { "upsert": true }).then(record =>{
    console.log(`Recorded change event for Report ID ${ObjID}`);
  }); 
}
  
