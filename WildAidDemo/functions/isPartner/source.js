exports = function(agency, documentDate, emailAddress){
  console.log(`Partner check - Checking email address: ${emailAddress} for documentAgency: ${agency}`);
  var database = context.services.get("mongodb-atlas").db("ofish");
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
            if (agencyDoc && agencyDoc.outboundPartnerAgencies) {
              const outboundPartnership = agencyDoc.outboundPartnerAgencies.find(partner => partner.name === userDoc.agency.name)
              if (outboundPartnership) {
                let isMatchingDate = false
                for (let date of outboundPartnership.dates) {
                  if (!isMatchingDate) {
                    if ((!date.fromDate || date.fromDate <= documentDate) && 
                        (!date.toDate || date.toDate >= documentDate)) {
                      isMatchingDate = true
                    }
                  }
                }
                if (isMatchingDate) {
                  console.log("Report is in a valid partnership interval")
                } else {
                  console.log("No matching dates for ${documentDate}")
                  return false
                }
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
