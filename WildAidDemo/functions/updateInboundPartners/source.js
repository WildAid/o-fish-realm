exports = function(changeEvent) {
  if (!changeEvent.fullDocument.outBoundPartnerAgencies) { return }
  const agencyCollection = context.services.get("mongodb-atlas").db("wildaid").collection("Agency");
  const agency = changeEvent.fullDocument.name

  agencyCollection.find({'inBoundPartnerAgencies.name': agency}).toArray()
  .then (docs => {
    let doc
    for (doc of docs) {
      const ouboundIndex = changeEvent.fullDocument.outBoundPartnerAgencies.findIndex(entry => (entry.name === doc.name))
      if (ouboundIndex === -1) {
        const inboundIndex = doc.inBoundPartnerAgencies.findIndex(entry => (entry.name === agency))
        if (inboundIndex === -1) {
          console.log(`Failed to find agency in array, but will continue`)
        } else {
          delete doc.inBoundPartnerAgencies[inboundIndex]
          agencyCollection.updateOne({_id: doc._id}, {$pull: {inBoundPartnerAgencies: {name: agency}}})
          .then (() => {
            console.log(`Removed agency ${agency} from document for agency ${doc.name}`)
          }, error => {
            console.log(`Failed to update Agency record: ${error}`)
          })
        }
      }
    }
  }, error => {
    console.log(`Finding Agency docs failed: ${error}`)
  })
  console.log(`There are ${changeEvent.fullDocument.outBoundPartnerAgencies.length} outbound agencies`)
  let partnerAgency
  for (partnerAgency of changeEvent.fullDocument.outBoundPartnerAgencies) {
    console.log(`partnerAgency is: ${JSON.stringify(partnerAgency)}`)
    if (partnerAgency.name) {
      console.log(`Fetching Agency document for ${partnerAgency.name}`)
    } else {
      console.log(`name not set`)
    }
    agencyCollection.findOne({name: partnerAgency.name})
    .then (doc => {
      if (doc) {
        const inboundIndex = doc.inBoundPartnerAgencies.findIndex(entry => (entry.name === agency))
        if (inboundIndex === -1) {
          console.log(`Need to push ${agency} to ${doc.name}`)
          agencyCollection.updateOne({_id: doc._id}, {$push: {inBoundPartnerAgencies: {name: agency, triaged: false, agencyWideAccess: false}}})
          .then (() => {
            console.log(`Added ${agency} as inbound partner to ${doc.name}`)
          }, error => {
            console.log(`Failed to add ${agency} to ${doc.name}: ${error}`)
          })
        }
      } else {
        console.log(`Couldn't find partnerAgency`)
      }
    }, error => {
      console.log(`Finding Agency doc failed: ${error}`)
    })
  }
};
