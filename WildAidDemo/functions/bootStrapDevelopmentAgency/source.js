exports = function(changeEvent) {

    const developerMode = context.values.get("developerMode");
    if (!developerMode) {
      return
    }
    console.log(`Running in developerMode`)
    
    const donorAgency = context.values.get("donorAgency");
    if (donorAgency === "") {
      return
    }
  
    const newAgency = changeEvent.fullDocument.name;
    console.log(`Attempting to bootstrap ${newAgency}`)
    const documentLimit = 10
    let database = context.services.get("mongodb-atlas").db("wildaid");
    let reportCollection = database.collection("BoardingReports");
    let menuDataCollection = database.collection("MenuData");
    let agencyCollection = database.collection("Agency");
    let photoCollection = database.collection("Photo");
    
    console.log(`Bootstrapping data for the ${newAgency} agency`)
    
    return menuDataCollection.findOne({agency: donorAgency})
    .then ( menuDataDoc => {
      if (!menuDataDoc) {
        console.log(`No MenuData document exists for ${donorAgency} agency`)
        return
      }
      console.log(`Found menuData for the donor agency: ${donorAgency}`)
      menuDataDoc.agency = newAgency
      delete menuDataDoc._id
      return menuDataCollection.insertOne(menuDataDoc)
      .then ( results => {
        console.log(`Inserted MenuData with _id: ${results.insertedId}`)
        return reportCollection.find({agency: donorAgency}).limit(documentLimit).toArray()
        .then (reportDocs => {
          console.log(`Found ${reportDocs.length} documents for ${donorAgency} agency`)
          for (i=0; i < reportDocs.length; i++) {
            reportDocs[i].agency = newAgency
            delete reportDocs[i]._id
          }
          return reportCollection.insertMany(reportDocs)
          .then ( results => {
            console.log(`Added ${results.insertedIds.length} BoardingReport documents for ${newAgency}`)
            return photoCollection.find({agency: donorAgency}).toArray()
            .then ( photos => {
              if (photos) {
                console.log(`${photos.length} Photo documents to copy`)
                for (i=0; i < photos.length; i++) {
                  photos[i].agency = newAgency
                  delete photos[i]._id
                }
                return photoCollection.insertMany(photos)
                .then ( results => {
                  console.log(`Added ${results.insertedIds.length} Photo documents for ${newAgency}`)
                }, error => {
                  console.log(`Failed to insert Photo documents: ${error}`)
                } )
              }
            }, error => {
              console.log(`Couldn't find photos for ${newAgency} agency: ${error}`)
            })
          }, error => {
            console.log(`Couldn't insert BoardingReports for agency ${newAgency}: ${error}`)
          })
        }, error => {
          console.log(`Couldn't read BoardingReports for donor agency (${donorAgency}): ${error}`)
        })
      }, error => {
        console.log(`Couldn't add MenuData for donor agency (${newAgency}): ${error}`)
      })
    }, error => {
      console.log(`Couldn't find MenuData for donor agency (${donorAgency}): ${error}`)
    })
  }
  