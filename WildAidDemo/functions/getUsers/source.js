exports = function(limit, offset){
var boardingsCollection = context.services.get("mongodb-atlas")
  .db("wildaid").collection("User");
  
   let amount = boardingsCollection.aggregate([
    {
      $count: 'total'
    }
  ]).toArray();
  
  let users = boardingsCollection.aggregate([
    {
      $skip: offset
    },{
      $limit: limit
    }
  ]).toArray();
  
  return {users, amount};
};