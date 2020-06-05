exports = function(limit, offset, query){
var boardingsCollection = context.services.get("mongodb-atlas")
  .db("wildaid").collection("BoardingReports");

 var amount = boardingsCollection.aggregate([
  {
    '$searchBeta': {
      'text': {
        'query': query, 
        'path': [
          'vessel.name', 'captain.name', 'inspection.summary.violations.offence.explanation', 'inspection.summary.violations.offence.code' 
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
 
 var boardings = boardingsCollection.aggregate([
  {
    '$searchBeta': {
      'text': {
        'query': query, 
        'path': [
          'vessel.name', 'captain.name', 'inspection.summary.violations.offence.explanation', 'inspection.summary.violations.offence.code' 
        ], 
        'fuzzy': {
          'maxEdits': 1.0
        }
      }
    }
  }, {
    '$skip': offset
  }, {
    '$limit': limit
  }
 ]).toArray();
 
 var highlighted = boardingsCollection.aggregate([
  {
    '$searchBeta': {
      'term': {
        'query': query, 
        'path': [
          'vessel.name', 'inspection.summary.violations.offence.explanation', 'inspection.summary.violations.offence.code'
        ], 
        'fuzzy': {
          'maxEdits': 1.0
        }
      }, 
      'highlight': {
        'path': [
          'vessel.name', 'inspection.summary.violations.offence.explanation', 'inspection.summary.violations.offence.code'
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
 

  return { boardings, amount, highlighted };
};