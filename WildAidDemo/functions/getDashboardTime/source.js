exports = function(query, filter){
  var dutyChange = context.services.get("mongodb-atlas")
  .db("ofish").collection("DutyChange");

  let aggregates = [];
  if (context.user && context.user.custom_data && context.user.custom_data.global && !context.user.custom_data.global.admin){
      aggregates.push({
        $match: { agency : context.user.custom_data.agency.name }
      });
  }

  if (!query){
    if (filter){
      var dateFilter = {};
      // email address is user.email, not reportingOfficer.email in dutyChange
      if (filter["reportingOfficer.email"]){
        filter["user.email"]=filter["reportingOfficer.email"];
        delete filter["reportingOfficer.email"];
      }
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
      aggregates.push({
          $match: filter
        });
    }
  } else {
    var aggregateTerms = {};

    if (filter){
      Object.keys(filter).map((key) => {
        switch (key){
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
    }
    aggregates.push(aggregateTerms);
  }

  let days = dutyChange.aggregate(aggregates.concat([
   {$match: {status:"On Duty"}}, {$lookup: {
  from: 'DutyChange',
  let: { dt: "$date", who: '$user.email', ag: '$agency'},
  as: 'later',
  pipeline: 
  [ 
    {$match: {$and: [
  {$expr: {$lt: ['$$dt', '$date']}},
  {$expr: {$eq: ['$$ag', '$agency']}},
  {$expr: {$eq: ['$$who', '$user.email']}}
]  }},
{$sort: {date: 1}},
]}}, {$match: {
  $expr: {$ne: ['$status', {$first: '$later.status'}]}
}}, {$addFields: {
  startDate: {$dateToString: { format: "%Y-%m-%d", date: "$date"}},
  endDate: {$dateToString: { format: "%Y-%m-%d", date: {$first: '$later.date'}}},
      }}, 
      {$addFields: {
  day: {
  $cond: { if: {$strcasecmp: ["$startDate", "$endDate"]}, 
   then: {$add: [1, {$divide: [{$subtract: [
     {$dateFromString: {dateString: "$endDate"}},
     {$dateFromString: {dateString: "$startDate"}}]},
     86400000]}]
   }, 
   else: 1 }},
  }}, {$group: {
  _id: '$user.email',
  days: {$sum: '$day'},
}}])).next().then(r=> r ? r.days : 0);
    
  let hours = dutyChange.aggregate(aggregates.concat([
   {$match: {status:"On Duty"}}, {$lookup: {
  from: 'DutyChange',
  let: { dt: "$date", who: '$user.email', ag: '$agency'},
  as: 'later',
  pipeline: 
  [ 
    {$match: {$and: [
  {$expr: {$lt: ['$$dt', '$date']}},
  {$expr: {$eq: ['$$ag', '$agency']}},
  {$expr: {$eq: ['$$who', '$user.email']}}
]  }},
{$sort: {date: 1}},
]}}, {$match: {
  $expr: {$ne: ['$status', {$first: '$later.status'}]}
}}, {$addFields: {
      hour: 
  {$divide: [
    {$subtract: [{$first: '$later.date'}, '$date']},
    3600000 ]}  
}}, {$group: {
  _id: '$user.email',
  hours: {$sum: '$hour'}}}
    ])).next().then(r=> r ? r.hours : 0);
    return { days,hours };
};
