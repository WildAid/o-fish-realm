exports = function(limit, offset, query, filter, agenciesToShareData){
  var boardingsCollection = context.services.get("mongodb-atlas")
  .db("wildaid").collection("BoardingReports");

  var agenciesCollection = context.services.get("mongodb-atlas")
  .db("wildaid").collection("Agency");

  let agencyAggregate = { "$addFields": {
      "numItems": 1
    }
  };
  
  if (context.user && context.user.custom_data && context.user.custom_data.global && !context.user.custom_data.global.admin && agenciesToShareData){
    agencyAggregate = {
      $match: { agency: { $in: agenciesToShareData } }
    };
  }
  
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
        filter.date = dateFilter;
      } else {
        if (filter.date){
          filter.date = {
            $gte: new Date(parseInt((new Date(filter.date)).valueOf()/86400000)*86400000),
            $lt: new Date((parseInt((new Date(filter.date)).valueOf()/86400000)+1)*86400000-6400000)
          }
        }
      }
      if (filter["inspection.summary.safetyLevel"]){
        filter["inspection.summary.safetyLevel.level"] = filter["inspection.summary.safetyLevel"];
        delete(filter["inspection.summary.safetyLevel"]);
      }
      amount = boardingsCollection
      .aggregate([agencyAggregate,
        {
          $match: filter
        },
        {
          $count: "total"
        }
      ]).toArray();
    } else {
      amount = boardingsCollection
      .aggregate([agencyAggregate,
        {
          $count: "total"
        }
      ]).toArray();
    }
    var boardings = [];
    if (filter){
      boardings = boardingsCollection
      .aggregate([agencyAggregate,
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
      boardings = boardingsCollection
      .aggregate([agencyAggregate,
        {
          $skip: offset
        },
        {
          $limit: limit
        }
      ]).toArray();
    }
    return {boardings, amount}
  } else {
    var aggregateTerms = {};

    if (filter){
      aggregateTerms = {
        '$search': {
          'compound': {
            "must": [],
            "filter": {
              'term': {
                'query': query,
                'path': [
                  'vessel.name', 'inspection.summary.violations.offence.explanation', 'inspection.summary.violations.offence.code'
                ],
                'fuzzy': {
                  'maxEdits': 1.0
                }
              }
            }
          },
          'highlight': {
            'path': [
              'vessel.name', 'inspection.summary.violations.offence.explanation', 'inspection.summary.violations.offence.code'
            ]
          }
        }
      }
      Object.keys(filter).map((key) => {
        switch (key){
          case "inspection.summary.safetyLevel":
          aggregateTerms.$search.compound.must.push({
            "search": {
              "query": filter["inspection.summary.safetyLevel"],
              "path":"inspection.summary.safetyLevel.level"
            }
          });
          break;
          case "date":
          aggregateTerms.$search.compound.must.push({
            "range": {
              "path": "date",
              "gte":  new Date(parseInt((new Date(filter.date)).valueOf()/86400000)*86400000),
              "lte":  new Date((parseInt((new Date(filter.date)).valueOf()/86400000) + 1)*86400000-6400000)
            }
          });
          break;
          case "date-from":
          aggregateTerms.$search.compound.must.push({
            "range": {
              "path": "date",
              "gte":  new Date(parseInt((new Date(filter["date-from"])).valueOf()/86400000)*86400000)
            }
          });
          break;
          case "date-to":
          aggregateTerms.$search.compound.must.push({
            "range": {
              "path": "date",
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
          'term': {
            'query': query,
            'path': [
              'vessel.name', 'captain.name', 'inspection.summary.violations.offence.explanation', 'inspection.summary.violations.offence.code', 'vessel.permitNumber', 'crew.license'
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
      }
    }
    
    var amount = boardingsCollection.aggregate([agencyAggregate,
      aggregateTerms, {
        '$count': "total"
      }
    ]).toArray();

    var boardings = boardingsCollection.aggregate([agencyAggregate,
      aggregateTerms, {
        '$skip': offset
      }, {
        '$limit': limit
      }
    ]).toArray();

    var highlighted = boardingsCollection.aggregate([agencyAggregate,
      aggregateTerms, {
        '$project': {
          'highlights': {
            '$meta': 'searchHighlights'
          }
        }
      }
    ]).toArray();

    return { boardings, amount, highlighted };
  }
};
