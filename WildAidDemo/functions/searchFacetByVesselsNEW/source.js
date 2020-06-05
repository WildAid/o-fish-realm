exports = function(limit, offset, query, filter){
var boardingsCollection = context.services.get("mongodb-atlas")
  .db("wildaid").collection("BoardingReports");

const aggregation = [
    {
      $project: {
        date: "$date",
        vessel: "$vessel.name",
        permitNumber: "$vessel.permitNumber",
        nationality: "$vessel.nationality",
        homePort: "$vessel.homePort",
        safetyLevel: "$inspection.summary.safetyLevel.level",
        highlight: "$highlight"
      }
    },{
      $sort: {
        "vessel":1,
        "date": 1
      }
    },{
      $group: {
        _id: ["$vessel", "$nationality", "$permitNumber", "$homePort", "$safetyLevel"],
        vessel : {$first: "$vessel"},
        permitNumber: {$first: "$permitNumber"},
        nationality: {$first: "$nationality"},
        homePort: {$first: "$homePort"},
        date: {$last: "$date"},
        safetyLevel: {$first:"$safetyLevel"},
        highlight: {$first: "$highlight"},
      }
    },
    {
      $sort: {
        "vessel":1,
        "date": 1
      }
    }
];

if (!query){
  var amount = 0;
  var highlighted = [];
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
    aggregation.unshift(
      {
        $match: filter
      }
    );
  }

  var amount = boardingsCollection
     .aggregate(aggregation.concat(
        {
          $count: "total"
        }
      )).next().then((item)=>item ? item.total: 0);

  var boardings = [];
    vessels = boardingsCollection
     .aggregate(aggregation.concat([
        {
          $skip: offset
        },
        {
          $limit: limit
        }
      ])).toArray();

  return { amount, vessels };
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
                'vessel.name'
              ],
              'fuzzy': {
                'maxEdits': 1.0
              }
            }
          }
        },
        'highlight': {
          'path': [
            'vessel.name'
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
        }
   }

   aggregateTerms = [aggregateTerms];

   var highlighted = boardingsCollection.aggregate(
    aggregateTerms.concat({
      '$project': {
        'highlights': {
          '$meta': 'searchHighlights'
        }
      }
    })).toArray();

   aggregateTerms = aggregateTerms.concat(aggregation);

   var amount = boardingsCollection.aggregate(
    aggregateTerms.concat({
      '$count': "total"
    })).next().then((item)=>item ? item.total: 0);

   var vessels = boardingsCollection.aggregate(
    aggregateTerms.concat([{
      '$skip': offset
    }, {
      '$limit': limit
    }
   ])).toArray();


    return { amount, highlighted, vessels };
  }
};
