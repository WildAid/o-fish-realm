exports = function(limit, offset, query, filter){
var usersCollection = context.services.get("mongodb-atlas")
  .db("ofish").collection("User");
  
if (!query){
  var amount = 0;
  if (filter){
    var dateFilter = {};
    if (filter["date-from"]){
      dateFilter.$gte = new Date(filter["date-from"]);
      delete filter["date-from"];
    }
    if (filter["date-to"]){
      dateFilter.$lte = new Date(filter["date-to"]);
      delete filter["date-to"];
    }
    if (dateFilter.$gte || dateFilter.$lte){
      filter.lastLogin = dateFilter;
    } else {
      if (filter.lastLogin){
        filter.lastLogin = {
          $gte: new Date(parseInt((new Date(filter.date)).valueOf()/86400000)*86400000),
          $lt: new Date((parseInt((new Date(filter.date)).valueOf()/86400000)+1)*86400000-6400000)
        }
      }
    }
    amount = usersCollection
     .aggregate([
        { 
          $match: filter 
        },
        {
          $count: "total"
        }
      ]).toArray();
  } else {
    amount = usersCollection
     .aggregate([
        {
          $count: "total"
        }
      ]).toArray();
  } 
  var users = [];
  if (filter){
   users = usersCollection
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
    users = usersCollection
     .aggregate([
        {
          $skip: offset
        },
        {
          $limit: limit
        }
      ]).toArray(); 
  }
  return {users, amount}
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
                'email', 'name.first', 'name.last', 'agency.name' 
              ], 
              'fuzzy': {
                'maxEdits': 1.0
              }
            }
          }
        },
        'highlight': {
          'path': [
            'email', 'name.first', 'name.last', 'agency.name' 
          ]
        }
      }
    }
    Object.keys(filter).map((key) => {
      switch (key){
        case "date":
          aggregateTerms.$search.compound.must.push({
            "range": {
                "path": "lastLogin",
                "gte":  new Date(parseInt((new Date(filter.date)).valueOf()/86400000)*86400000),
                "lte":  new Date((parseInt((new Date(filter.date)).valueOf()/86400000) + 1)*86400000-6400000)
            }
          });
          break;
        case "date-from":
          aggregateTerms.$search.compound.must.push({
            "range": {
                "path": "lastLogin",
                "gte":  new Date(parseInt((new Date(filter["date-from"])).valueOf()/86400000)*86400000)
            }
          });
          break;
        case "date-to":
          aggregateTerms.$search.compound.must.push({
            "range": {
                "path": "lastLogin",
                "lte":  new Date((parseInt((new Date(filter["date-to"])).valueOf()/86400000) + 1)*86400000-6400000)
            }
          });
          break;
        default:
          aggregateTerms.$search.compound.must.push({
                  "search": {
                    "query": filter[key],
                    "path": key
                  }
                })
        break;
      }
    })
   } else {
      aggregateTerms = {
          '$search': {
            'text': {
              'query': query, 
              'path': [
                'name.first', 'name.last', 'agency.name'  
              ], 
              'fuzzy': {
                'maxEdits': 1.0
              }
            },
            'highlight': {
              'path': [
                'name.first', 'name.last', 'agency.name' 
              ]
            }
          }
        }
   }
   
  var amount = usersCollection.aggregate([
    aggregateTerms, {
      '$count': "total"
    }
  ]).toArray();
   
  var users = usersCollection.aggregate([
    aggregateTerms, {
      '$skip': offset
    }, {
      '$limit': limit
    }
  ]).toArray();
   
  var highlighted = usersCollection.aggregate([
    aggregateTerms, {
      '$project': {
        'highlights': {
          '$meta': 'searchHighlights'
        }
      }
    }
  ]).toArray();
   
  return { users, amount, highlighted };
}
};
