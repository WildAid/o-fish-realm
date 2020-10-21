exports = function(limit, offset, query, filter){
  var agencyCollection = context.services.get("mongodb-atlas")
    .db("wildaid").collection("Agency");
  
  var boardingsCollection = context.services.get("mongodb-atlas")
      .db("wildaid").collection("BoardingReports");
  
  var boardings = boardingsCollection.aggregate([{$project: {
        'agency': '$agency',
      }}, {$group: {
        _id: ["$agency"],
        name: {$first: "$agency"},
        count: {$sum: 1}
      }}
  ]).toArray();
     
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
    agencies.then((result)=>{
      for (var agency of result){
        agency.boardings = boardingsCollection.aggregate([
            {$match: { "agency": agency.name }},
            {$project: {
              'agency': '$agency',
            }}, {$group: {
              _id: ["$agency"],
              name: {$first: "$agency"},
              count: {$sum: 1}
            }}
        ]).next().then(r => (r ? r.count : 0));
        agency.violations = boardingsCollection.aggregate([
            { $match: { "agency": agency.name, "inspection.summary.violations.disposition": {$in: ["Warning", "Citation"]}} },
            { $count: "total" }
        ]).next().then(r => (r ? r.total : 0));
      }
    });
    return {amount, agencies }
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
     
    return { agencies, amount, boardings, highlighted };
  }
};
  