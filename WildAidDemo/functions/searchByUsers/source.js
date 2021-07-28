exports = function(limit, offset, query){
var boardingsCollection = context.services.get("mongodb-atlas")
  .db("wildaid").collection("BoardingReports");
  
  let amount = boardingsCollection.aggregate([
    {
      '$searchBeta': {
        'text': {
          'query': query, 
          'path': [
            'reportingOfficer.name.first', 'reportingOfficer.name.last'
          ], 
          'fuzzy': {
            'maxEdits': 1.0
          }
        }
      }
    },{
    '$group': {
        _id : '$reportingOfficer.name',
        agency: { $addToSet: "$reportingOfficer.agency" },
        boardings:{ $sum: 1 },
        dispositions: { $push: "$inspection.summary.violations.disposition" },
      },
    },{
      $count: 'total'
    }
  ]).toArray();
  
  let users = boardingsCollection.aggregate([
  {
    '$searchBeta': {
      'text': {
        'query': query, 
        'path': [
          'reportingOfficer.name.first', 'reportingOfficer.name.last' 
        ], 
        'fuzzy': {
          'maxEdits': 1.0
        }
      }
    }
  },
  {
    '$group': {
        _id : '$reportingOfficer.name',
        agency: { $addToSet: "$reportingOfficer.agency" },
        boardings:{ $sum: 1 },
        dispositions: { $push: "$inspection.summary.violations.disposition" },
      },
  }, 
  {
    '$skip': offset
  }, {
    '$limit': limit
  }
 ]).toArray();
 
 return {users, amount};
};
