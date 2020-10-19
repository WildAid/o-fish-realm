exports = function(agency, documentDate, emailAddress){
  console.log(`Checking email address: ${emailAddress} for documentAgency: ${agencyDoc.name}`);
  var database = context.services.get("mongodb-atlas").db("wildaid");
  var userCollection = database.collection("User");
  var agencyCollection = database.collection("Agency");
  
  return userCollection.findOne({email: emailAddress})
  .then (userDoc => { 
    if (userDoc) {
      console.log('Found User document');
      return agencyCollection.findOne({name: userDoc.agency.name})
      .then (userAgencyDoc => {
        if (userAgencyDoc) {
          return agencyCollection.findOne({name: agency})
          .then (agencyDoc => {
            if (agencyDoc) {
              const outboundPartnership = agencyDoc.outBoundPartnerAgencies.find(partner => partner.name === userDoc.agency.name)
              if (outboundPartnership) {
                if (outboundPartnership.fromDate && outboundPartnership.fromDate > documentDate) { return false }
                if (outboundPartnership.toDate && outboundPartnership.toDate < documentDate) { return false }
                console.log("Report is in a valid partnership interval")
                const inboundPartnership = userAgencyDoc.inBoundPartnerAgencies.find(partner => partner.name === agency)
                if (inboundPartnership) {
                  if (inboundPartnership.agencyWideAccess) { return true }
                  if (userDoc.inboundPartnerAgencies.indexOf(agency) > -1) {
                    console.log(`${email} has a valid partnership for this report`)
                    return true
                  } else {
                    console.log(`${email} is not one of the agency members covered by the partnership`)
                    return false
                  }
                } else {
                  console.log("No inbound partnership")
                  return false
                }
              } else {
                console.log("No partnership fount")
                return false
              }
            } else {
              console.log(`No Agency document`)
              return false              
            }
          }, error => {
            console.log(`Couldn't find agency doc for user: ${error}`)
            return false
          })
        } else {
          console.log(`No agency doc for the user`)
          return false
        }
      }, error => {
        console.log(`Couldn't find agency doc for user: ${error}`)
        return false
      })
    } else {
      console.log('Failed to find User document');
      return false;
    }
  }, error => {
    `Failed to find User doc: ${error}`
    return false
  })
};
