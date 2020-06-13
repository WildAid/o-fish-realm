
exports = function(payload, response) {
  
/***  Point East of Galapagos Islands
 {
   latitude: -0.608045, 
   longitude:-88.294683
 }
 radius: 450 miles === 724205 meters
*/

// Usage Example: Generates 100 points that is in a 1km radius from the given lat and lng point.
//var randomGeoPoints = generateRandomPoints({'lat':24.23, 'lng':23.12}, 1000, 100);

/******CALLING FUNCTIONS***************

// var randomGeoPoints = generateRandomPoints({'lat':-0.608045, 'lng':-88.294683}, 724205, 1000);
// return randomGeoPoints;

*************************************/
};



/* Generates number of random geolocation points given a center and a radius.
* @param  {Object} center A JS object with lat and lng attributes.
* @param  {number} radius Radius in meters.
* @param {number} count Number of points to generate.
* @return {array} Array of Objects with lat and lng attributes.
*************************************************************************/
function generateRandomPoint(center, radius) {
  var x0 = center.lng;
  var y0 = center.lat;
  // Convert Radius from meters to degrees.
  var rd = radius/111300;

  var u = Math.random();
  var v = Math.random();

  var w = rd * Math.sqrt(u);
  var t = 2 * Math.PI * v;
  var x = w * Math.cos(t);
  var y = w * Math.sin(t);

  var xp = x/Math.cos(y0);

  // Resulting point.
  return {'latitude': y+y0, 'longitude': xp+x0};
}

function generateRandomPoints(center, radius, count) {
  const reports = context.services.get("mongodb-atlas").db("wildaid").collection("BoardingReports");
  var points = [];
  var randomPoint;
  for (var i=0; i<count; i++) {
    randomPoint = generateRandomPoint(center, radius);
    points.push(randomPoint);
    
    //add location field to BoardingReports collection as findOneAndUpdate
    reports.findOneAndUpdate({'location':{$exists: false}}, { $set: { 'location' : randomPoint } });
  }
  return points;
}
