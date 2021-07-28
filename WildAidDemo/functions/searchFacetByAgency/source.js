exports = function(limit, offset, query, filter){
var agencyCollection = context.services.get("mongodb-atlas")
  .db("ofish").collection("Agency");

var userCollection = context.services.get("mongodb-atlas")
    .db("ofish").collection("User");

if (!query){
  var amount = 0;
  if (filter){
    amount = agencyCollection
     .aggregate([
        {
          $match: filter
        },
        {
          $count: "total"
        }
      ]).toArray();
  } else {
    amount = agencyCollection
     .aggregate([
        {
          $count: "total"
        }
      ]).toArray();
  }
  var agencies = [];
  if (filter){
   agencies = agencyCollection
     .aggregate([
        {
          $match: filter
        },
        {
          $skip: offset
        },
        {
          $limit: limit
        }
      ]).toArray();
  } else {
    agencies = agencyCollection
     .aggregate([
        {
          $skip: offset
        },
        {
          $limit: limit
        }
      ]).toArray();
  }

  var officers = userCollection.aggregate([
  {
    $project: {
      'agency': '$agency.name',
      'officer': {$concat: ['$name.first', ' ', '$name.last']}
    }
  },
  {
    $group: {
      _id: ["$agency"],
      officers: {$push: "$officer"}
    }
  }
 ]).toArray();

  return {agencies, amount, officers }
} else {
   var aggregateTerms = {};

   if (filter){
     aggregateTerms = {
      '$search': {
        'compound': {
          "must": [],
          "filter": {
            'text': {
              'query': query,
              'path': [
                'name', 'email', 'description'
              ],
              'fuzzy': {
                'maxEdits': 1.0
              }
            }
          }
        },
        'highlight' : {
          'path': [
            'name', 'email', 'description'
          ]
        }
      }
    }
    Object.keys(filter).map((key) => {
        aggregateTerms.$search.compound.must.push({
                "search": {
                  "query": filter[key],
                  "path": key
                }
              })
    })
   } else {
      aggregateTerms = {
          '$search': {
            'text': {
              'query': query,
              'path': [
                'name', 'email', 'description'
              ],
              'fuzzy': {
                'maxEdits': 1.0
              }
            },
            'highlight': {
              'path': [
                'name', 'email', 'description'
              ]
            }
          }
        }
   }

  var amount = agencyCollection.aggregate([
    aggregateTerms, {
      '$count': "total"
    }
  ]).toArray();

  var agencies = agencyCollection.aggregate([
    aggregateTerms, {
      '$skip': offset
    }, {
      '$limit': limit
    }
  ]).toArray();

  var highlighted = agencyCollection.aggregate([
    aggregateTerms, {
      '$project': {
        'highlights': {
          '$meta': 'searchHighlights'
        }
      }
    }
  ]).toArray();

  return { agencies, amount, highlighted };
}
};
