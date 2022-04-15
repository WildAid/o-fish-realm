exports = function () {

    const boardingReports = context.services
        .get("mongodb-atlas")
        .db("wildaid")
        .collection("BoardingReports");

    const captains = boardingReports.aggregate([
        {
            $match: {
                "captain.name": { $nin: [null, ""] }
            }
        },
        {
            $project: {
                captain: 1,
                _id: 0
            },
        }
    ]).toArray();


    const names = [];
    captains.then(result => {
        for (let a of result) {
            if (!names.includes(a.captain.name.trim())) {
                names.push(a.captain.name.trim())
            }
        }
    })


    return names;
};