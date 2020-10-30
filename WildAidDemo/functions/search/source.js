exports = function(query){
  var boardingsCollection = context.services.get("mongodb-atlas")
  .db("wildaid").collection("BoardingReports");
  
  var vessels = boardingsCollection.aggregate([
  {
    '$search': {
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
   '$group' : {
     _id : '$vessel.name',
     permitNumber: { $first: '$vessel.permitNumber' },
     catches: { $push: "$inspection.actualCatch.fish" }
    }
  },{
    '$limit': 3
  }
 ]).toArray();
 
  var vesselsAmount = boardingsCollection.aggregate([
  {
    '$search': {
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
  },{
    '$count': 'total'
  }
 ]).toArray();
 
  var crew = boardingsCollection.aggregate([
  {
    '$search': {
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
      'captain.name': 1, 
      'captain.license': 1,
      'crew.name': 1, 
      'crew.license': 1,
      'vessel.name': 1,
      'highlights': {
        '$meta': 'searchHighlights'
      }
    }
  }
]).toArray();

  var boardings = boardingsCollection.aggregate([
  {
    '$search': {
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
    '$project': {
      vessel: "$vessel.name",
      date: "$date",
      catch: "$inspection.actualCatch.fish",
      violations: "$inspection.summary.violations",
      safetyLevel: "$inspection.summary.safetyLevel"
    }
  }, {
    '$limit': 3
  }
 ]).toArray();
 
  var boardingsAmount = boardingsCollection.aggregate([
  {
    '$search': {
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
    '$project': {
      vessel: "$vessel.name",
      date: "$date",
      catch: "$inspection.actualCatch.fish",
      violations: "$inspection.summary.violations",
      safetyLevel: "$inspection.summary.safetyLevel"
    }
  }, {
    '$count': 'total'
  }
 ]).toArray();

  var highlighted = boardingsCollection.aggregate([
  {
    '$search': {
      'term': {
        'query': query, 
        'path': [
          'captain.name', 'crew.name', 'vessel.name', 'inspection.summary.violations.offence.explanation', 'inspection.summary.violations.offence.code'
        ], 
        'fuzzy': {
          'maxEdits': 1.0
        }
      }, 
      'highlight': {
        'path': [
          'captain.name', 'crew.name', 'vessel.name', 'inspection.summary.violations.offence.explanation', 'inspection.summary.violations.offence.code'
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

  return {vessels, vesselsAmount, boardings, boardingsAmount, crew, highlighted};
};