exports = function(limit, offset, query, filter){
  var boardingsCollection = context.services.get("mongodb-atlas")
  .db("wildaid").collection("BoardingReports");
  const aggregationTerm = [
    {
      $project: {
        crewTemp: [
          {
            crew: "$captain",
            rank: "captain",
          },
          {
            crew: "$crew",
            rank: "crew"
          }
        ],
        captain: "$captain",
        violations: {
          $map: {
            input: "$inspection.summary.violations",
            in : {
              $sum: 1
            }
          }
        },
        vessel: "$vessel.name",
        date: 1,
        safetyLevel: "$inspection.summary.safetyLevel.level"
      }
    },
    {
      $unwind: "$crewTemp"
    },
    {
      $unwind: "$crewTemp.crew"
    },
    {
      $project: {
        name: "$crewTemp.crew.name",
        license: "$crewTemp.crew.license",
        vessel: 1,
        violations: {
          $sum: "$violations"
        },
        date: 1,
        rank: "$crewTemp.rank",
        safetyLevel: 1
      }
    },{
      $sort: {
        "name" : 1,
        "vessel": 1
      }
    },
    {
      $group: {
        _id: ["$name", "$license"],
        name : {$last: "$name"},
        license: {$last: "$license"},
        vessels: {$push: "$vessel"},
        safetyLevel : {$last: "$safetyLevel"},
        date: { $last: "$date"},
        violations: { $sum: "$violations" }
      }
    }
  ];
  if (!query){
    var boardingReports = context.services.get("mongodb-atlas")
    .db("wildaid").collection("BoardingReports");
    if (filter) {
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
        const value = filter["inspection.summary.safetyLevel"];
        delete filter["inspection.summary.safetyLevel"];
        filter["inspection.summary.safetyLevel.level"] = value;
      }
      aggregationTerm.unshift({"$match": filter});
    }
    var promise = boardingsCollection.aggregate(aggregationTerm.concat([{$count: "total"}])).next()
    .then((count)=>{
      amount = count;
      return boardingsCollection
      .aggregate(aggregationTerm.concat([
        {
          $sort: {
            "name" : 1,
            "vessel": 1
          }
        },
        {
          $skip: offset
        },
        {
          $limit: limit
        }
      ])).toArray().then((data)=>{
        return {amount: count.total, crew: data, highlights:[]};
      }).catch( e => { console.log(e); return []; });
    }).catch( e => { console.log(e); return []; });
    return promise;
  } else {
    var searchTerms = {};

    if (filter){
      searchTerms = {
        '$search': {
          'compound': {
            "must": [],
            "filter": {
              'text': {
                'query': query,
                'path': [
                  'captain.name', 'crew.name', 'crew.license'
                ],
                'fuzzy': {
                  'maxEdits': 1.0
                }
              }
            }
          },
          'highlight': {
            'path': [
              'captain.name', 'crew.name', 'crew.license'
            ]
          }
        }
      }
      Object.keys(filter).map((key) => {
        switch (key){
          case "inspection.summary.safetyLevel":
          searchTerms.$search.compound.must.push({
            "search": {
              "query": filter["inspection.summary.safetyLevel"],
              "path":"inspection.summary.safetyLevel.level"
            }
          });
          break;
          case "date":
          searchTerms.$search.compound.must.push({
            "range": {
              "path": "date",
              "gte":  new Date(parseInt((new Date(filter.date)).valueOf()/86400000)*86400000),
              "lte":  new Date((parseInt((new Date(filter.date)).valueOf()/86400000) + 1)*86400000-6400000)
            }
          });
          break;
          case "date-from":
          searchTerms.$search.compound.must.push({
            "range": {
              "path": "date",
              "gte":  new Date(parseInt((new Date(filter["date-from"])).valueOf()/86400000)*86400000)
            }
          });
          break;
          case "date-to":
          searchTerms.$search.compound.must.push({
            "range": {
              "path": "date",
              "lte":  new Date((parseInt((new Date(filter["date-to"])).valueOf()/86400000) + 1)*86400000-6400000)
            }
          });
          break;
          default:
          searchTerms.$search.compound.must.push({
            "search": {
              "query": filter[key],
              "path": key
            }
          })
          break;
        }
      })
    } else {
      searchTerms = {
        '$search': {
          'text': {
            'query': query,
            'path': [
              'captain.name', 'crew.name', 'crew.license'
            ],
            'fuzzy': {
              'maxEdits': 1.0
            }
          },
          'highlight': {
            'path': [
              'captain.name', 'crew.name', 'crew.license'
            ]
          }
        }
      }
    }

    searchTerms = [searchTerms].concat([
    {
      $project: {
        captain: "$captain",
        crew: "$crew",
        violations: {
          $sum:{
            $map: {
              input: "$inspection.summary.violations",
              in : {
                $sum: 1
              }
            }
          }
        },
        vessel: "$vessel.name",
        date: 1,
        safetyLevel: "$inspection.summary.safetyLevel.level",
        'highlights': {
          '$meta': 'searchHighlights'
        }
      }
    }
  ]);

    var promise = boardingsCollection.aggregate(searchTerms.concat([{$count: "total"}])).next()
    .then((count)=>{
      return boardingsCollection.aggregate(
        searchTerms.concat(
          {
            '$project': {
              'highlights': {
                '$meta': 'searchHighlights'
              }
            }
          })).toArray().then((highlighted)=>{
            return boardingsCollection
            .aggregate(searchTerms.concat([
              {
                $sort: {
                  "name" : 1
                }
              },
              {
                $skip: offset
              },
              {
                $limit: limit
              }
            ])).toArray().then((data)=>{
              return {amount: count.total, highlights : highlighted, crew: data};
            });
          });
        }).catch( e => { console.log(e); return []; });
    return promise;
  }
};
