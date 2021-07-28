exports = function(limit, offset, query){
  var boardingsCollection = context.services.get("mongodb-atlas")
    .db("ofish").collection("BoardingReports");
    
  var crew = boardingsCollection.aggregate([
    {
      '$searchBeta': {
        'term': {
          'query': query, 
          'path': [
            'captain.name', 'crew.name',
          ], 
          'fuzzy': {
            'maxEdits': 1.0
          }
        }, 
        'highlight': {
          'path': [
            'captain.name', 'crew.name'
          ]
        }
      }
    }, {
      '$project': {
        'captain' : '$captain',
        'crew': "$crew",
        'violations': "$inspection.summary.violations", 
        'vessel': "$vessel.name", 
        'date': 1,
        'safetyLevel': "$inspection.summary.safetyLevel",
        'highlights': {
          '$meta': 'searchHighlights'
        }
      }
    }
  ]).toArray();
  
  var highlighted = boardingsCollection.aggregate([
  {
    '$searchBeta': {
      'term': {
        'query': query, 
        'path': [
          'captain.name', 'crew.name'
        ], 
        'fuzzy': {
          'maxEdits': 1.0
        }
      }, 
      'highlight': {
        'path': [
          'captain.name', 'crew.name'
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

  return { crew, highlighted };
};

