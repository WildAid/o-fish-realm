exports = function(limit, offset){
 var boardingReports = context.services.get("mongodb-atlas")
    .db("wildaid").collection("BoardingReports");
    
  var amount = boardingReports
     .aggregate([
       {
          $project: {
            date: "$date",
            vessel: "$vessel",
            safetyLevel: "$inspection.summary.safetyLevel"
          }
        },
        {
          $count: "total"
        }
      ]).toArray(); 
      
 var vessels = boardingReports
     .aggregate([
       {
          $project: {
            date: "$date",
            vessel: "$vessel",
            safetyLevel: "$inspection.summary.safetyLevel"
          }
        },
        {
          $skip: offset
        },
        {
          $limit: limit
        }
      ]).toArray(); 
  
  return { vessels, amount};
};
