exports = function(limit, offset, query, filter){
  var boardingsCollection = context.services.get("mongodb-atlas")
  .db("wildaid").collection("BoardingReports");

  if (!query){
    var boardingReports = context.services.get("mongodb-atlas")
    .db("wildaid").collection("BoardingReports");
    var amount = [];
    var highlighted = [];
    var aggregation = [];

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
        filter["inspection.summary.safetyLevel.level"] = filter["inspection.summary.safetyLevel"];
        delete(filter["inspection.summary.safetyLevel"]);
      }
      aggregation.push({"$match": filter});
    }
    aggregation.push(
      {
        $project: {
          captain : '$captain',
          crew: "$crew",
          violations: "$inspection.summary.violations",
          vessel: "$vessel.name",
          date: 1,
          safetyLevel: "$inspection.summary.safetyLevel"
        }
      }
    );
    var crew = boardingsCollection
    .aggregate(aggregation).toArray()
    .then(data => {
      let crewList = [];

      data.map((item) => {
        if(item.captain) {
          crewList.push({
            name: item.captain.name,
            license: item.captain.license,
            vessel: item.vessel,
            violations: Array.isArray(item.violations) ? item.violations.length : 0,
            date: item.date,
            rank: "captain",
            safetyLevel: item.safetyLevel,
          });
        }
        item.crew.map((crewMember) => {
          if(crewMember) {
            crewList.push({
              name: crewMember.name,
              license: crewMember.license,
              vessel: item.vessel,
              violations: Array.isArray(item.violations) ? item.violations.length : 0,
              date: item.date,
              rank: "crew",
              safetyLevel: item.safetyLevel,
            });
          }
          return null;
        });
        return null;
      });
      amount.push(crewList.length);
      return crewList.slice(offset, offset+limit);
    }).catch( e => { console.log(e); return []; });

    return {crew, amount, highlighted};
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
                  'captain.name', 'crew.name'
                ],
                'fuzzy': {
                  'maxEdits': 1.0
                }
              }
            }
          },
          'highlight': {
            'path': [
              'captain.name', 'crew.name'
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
      }
    }

    var crew = boardingsCollection.aggregate([
      aggregateTerms,
      {
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
      aggregateTerms,
      {
        '$project': {
          'highlights': {
            '$meta': 'searchHighlights'
          }
        }
      }
    ]).toArray();

    return { crew, highlighted };
  }
};
