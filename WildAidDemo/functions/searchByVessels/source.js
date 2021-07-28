exports = function(limit, offset, query){
 var boardingsCollection = context.services.get("mongodb-atlas")
    .db("wildaid").collection("BoardingReports");
      
  var amount = boardingsCollection.aggregate([
  {
    '$searchBeta': {
      'text': {
        'query': query, 
        'path': [
          'vessel.name'
        ], 
        'fuzzy': {
          'maxEdits': 1.0
        }
      }
    }
  }, {
    '$count': "total"
  }
 ]).toArray();  
 
 var vessels = boardingsCollection.aggregate([
  {
    '$searchBeta': {
      'text': {
        'query': query, 
        'path': [
          'vessel.name'
        ], 
        'fuzzy': {
          'maxEdits': 1.0
        }
      }
    }
  }, {
    '$project': {
        date: "$date",
        vessel: "$vessel",
        safetyLevel: "$inspection.summary.safetyLevel"
      }
  },{
    '$skip': offset
  },{
    '$limit': limit
  }
 ]).toArray(); 
 
 var highlighted = boardingsCollection.aggregate([
  {
    '$searchBeta': {
      'term': {
        'query': query, 
        'path': [
          'vessel.name'
        ], 
        'fuzzy': {
          'maxEdits': 1.0
        }
      }, 
      'highlight': {
        'path': [
          'vessel.name'
        ]
      }
    }
  }, {
    '$project': {
      'highlights': {
        '$meta': 'searchHighlights'
      }
    }
  }
]).toArray();
  
  return { vessels, amount, highlighted };
};
