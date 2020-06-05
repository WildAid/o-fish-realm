exports = function(limit, offset, filter){
 var boardingReports = context.services.get("mongodb-atlas")
    .db("wildaid").collection("BoardingReports");
  var amount = 0;
  if (filter){
    amount = boardingReports
     .aggregate([
        { 
          $match: filter 
        },
        {
          $count: "total"
        }
      ]).toArray();
  } else {
    amount = boardingReports
     .aggregate([
        {
          $count: "total"
        }
      ]).toArray();
  } 
  var boardings = [];
  if (filter){
   boardings = boardingReports
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
    boardings = boardingReports
     .aggregate([
        {
          $skip: offset
        },
        {
          $limit: limit
        }
      ]).toArray(); 
  }
  return {boardings, amount}
};