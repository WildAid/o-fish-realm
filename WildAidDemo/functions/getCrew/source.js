exports = function(offset, limit){
 var boardingsCollection = context.services.get("mongodb-atlas")
    .db("ofish").collection("BoardingReports");
  var amount = [];
  
  var crew = boardingsCollection
      .aggregate([
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
    ]).toArray()
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
 
    return {crew, amount};
};
