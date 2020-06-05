exports = function(limit, offset){
var boardingsCollection = context.services.get("mongodb-atlas")
  .db("wildaid").collection("BoardingReports");
  
   let amount = boardingsCollection.aggregate([
    {
    '$group' : {
      _id : '$reportingOfficer.name',
      }
    },{
      $count: 'total'
    }
  ]).toArray();
  
  let users = boardingsCollection.aggregate([
    {
    '$group' : {
      _id : '$reportingOfficer.name',
      agency: { $addToSet: "$reportingOfficer.agency" },
      boardings:{ $sum: 1 },
      dispositions: { $push: "$inspection.summary.violations.disposition" },
      }
    },{
      $skip: offset
    },{
      $limit: limit
    }
  ]).toArray();
  
  return {users, amount};
};