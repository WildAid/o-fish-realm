exports = function(change) {

  const mongodb = context.services.get("mongodb-atlas");
  const history = mongodb.db('ofish').collection('ChangeHistory');
  
  const ObjID = change.fullDocument._id;
 
  const insertObj = {
    _id : ObjID,
    changeType : 'INSERT',
    date_created : new Date(),
    originalDocument: change.fullDocument,
    changeEvents:[]
  };
  
     return history.insertOne(insertObj).then(record =>{
       console.log(`Inserted change history event for Report ID ${ObjID}`);
     }); 
}
  
