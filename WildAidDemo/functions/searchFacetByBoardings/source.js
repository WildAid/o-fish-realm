exports = function(limit, offset, query, filter, agenciesToShareData){
  const boardingsCollection = context.services.get("mongodb-atlas").db("wildaid").collection("BoardingReports");
  let boardings = [];
  let amount = 0;
  let sortingTerms = {
    "$sort": {
      date: -1
    }
  }

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
    if (filter){
      let dateFilter = {};
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

      if (filter["captain.lastName"]) {
        filter["captain.name"] ={
          $regex:  Array.from(filter["captain.lastName"]).join("|"),
        };
        delete(filter["captain.lastName"]);
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

    if (filter){
      boardings = boardingsCollection
      .aggregate([agencyAggregate,sortingTerms,
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
      .aggregate([agencyAggregate,sortingTerms,
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
    let aggregateTerms = {};

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
          case "captain.lastName":
          aggregateTerms.$search.compound.must.push({
           "search": {
               "compound": {
                 "filter": [
                   
                   {
                      "text": {
                         "query": Array.from(filter["captain.lastName"]).join("|"),
                         "path":"captain.name"
                      },
                   }
                 ]
             }
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
              'vessel.name', 'inspection.summary.violations.offence.explanation', 'inspection.summary.violations.offence.code', 'vessel.permitNumber', 'crew.license'
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
    
    amount = boardingsCollection.aggregate([
      aggregateTerms,
      agencyAggregate, {
        '$count': "total"
      }
    ]).toArray();

    boardings = boardingsCollection.aggregate([
      aggregateTerms,
      sortingTerms,
      agencyAggregate, {
        '$skip': offset
      }, {
        '$limit': limit
      }
    ]).toArray();

    const highlighted = boardingsCollection.aggregate([
      aggregateTerms,
      agencyAggregate, {
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
