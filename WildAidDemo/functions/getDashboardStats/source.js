exports = function(query, filter){
  var boardingsCollection = context.services.get("mongodb-atlas")
  .db("wildaid").collection("BoardingReports");

  let aggregates = [];
  if (context.user && context.user.custom_data && context.user.custom_data.global && !context.user.custom_data.global.admin){
      aggregates.push({
        $match: { agency : context.user.custom_data.agency.name }
      });
  }

  if (!query){
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
      aggregates.push({
          $match: filter
        });
    }
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

    aggregates.push(aggregateTerms);

  }

  let amount = boardingsCollection
      .aggregate(aggregates.concat(
        {
          $count: "total"
        }
      )).next().then(r=> r ? r.total : 0);
  let violations = boardingsCollection
    .aggregate(aggregates.concat([{"$project": {
          "violations": "$inspection.summary.violations",
        }},
        { $unwind: "$violations" },
        { $count: "total" }
    ])).next().then(r=> r ? r.total : 0);
 /* let warnings = boardingsCollection
    .aggregate(aggregates.concat([{"$project": {
          "violations": "$inspection.summary.violations",
        }},
        { $unwind: "$violations" },
        { $match: { "violations.disposition": "Warning" }},
        { $count: "total" }
    ])).next(); */
    let warnings = boardingsCollection
        .aggregate(aggregates.concat([{$match: {"inspection.summary.violations.disposition": "Warning"}}, {
            $count: "total"
          }])).next().then(r=> r ? r.total : 0);
    let citations = boardingsCollection
        .aggregate(aggregates.concat([{$match: {"inspection.summary.violations.disposition": "Citation"}}, {
            $count: "total"
          }])).next().then(r=> r ? r.total : 0);

    return { warnings, amount, citations, violations };
};
