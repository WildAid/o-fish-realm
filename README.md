# MongoDB Realm Application for WildAid's O-FISH project

**This app is work-in-progress, as is this README**

# Table of Contents
1. [Overview](#overview)
1. [O-FISH Installation](#O-FISHinstall)
1. [Import this repository as standalone code](#standalone)
1. [O-FISH Project Goals](#goals)
1. [O-FISH Components](#components)
1. [O-FISH Infrastructure](#infrastructure)

## Overview
The [WildAid Marine Program](https://marine.wildaid.org/) works to protect vulnerable marine environments.

O-FISH (Officer Fishery Information Sharing Hub) is a multi-platform application that enables officers to browse and record boarding report data from their mobile devices.

This repo implements the O-FISH Realm serverless backend application and contains sample data. The `WildAidSampleBackup` directory contains a `mongodump` of the database, suitable for building and testing. The `WildAidDemo` directory contains the serverless functions, triggers, values, Realm Sync rules and other code that makes up the backend for the [web](https://github.com/WildAid/o-fish-web), [iOS](https://github.com/WildAid/o-fish-ios) and [Android](https://github.com/WildAid/o-fish-android) applications - together with the connection to the associated MongoDB Atlas database.


## <A NAME="O-FISHinstall">O-FISH Installation</A>
See the [O-FISH installation guide](https://wildaid.github.io/), which includes instructions for using this repository in the context of building the O-FISH application.

## <A NAME="standalone">Import this repository as standalone code</a>
### How to import and configure your own MongoDB Realm app

1. Create your [Atlas Cluster](https://cloud.mongodb.com) and [Realm App](https://cloud.mongodb.com). Optionally, [import sample data](https://wildaid.github.io/) (use `WildAidMinimalBackup` if you don't need thousands of sample documents)
1. Take a note of the Realm App-Id `appname-xxxxx` 
1. Generate an API key pair for your project and note the public and private IDs (Access Manager/Project) from the Atlas UI
1. Whitelist your IP address for API access (through the Atlas UI)
1. Install `realm-cli`: `npm install -g mongodb-realm-cli`
1. Log in to your Atlas/Realm project: `realm-cli login --api-key=my-api-key --private-api-key=my-private-api-key`
1. Add your AWS private API key to your app as a Realm Secret: `realm-cli secrets add --app-id=appname-xxxxx --name=AWS-secret-key --value=my-aws-secret-api-key` - Just use a dummy string if you are not planning on using AWS services
1. Download the Realm app code: `git clone https://github.com/WildAid/o-fish-realm.git`
1. `cd o-fish-realm/WildAidDemo`
1. Add in the App name (from step 1) in the "name" field in `config.json` and add the cluster name to the "clusterName" field in `services/RealmSync/config.json` and `services/mongodb-atlas/config.json` files
1. If using AWS services, edit the values in `values/awsRegion.json`, `values/destinationEmailAddress.json` and `values/sourceEmailAddress.json`
1. If using AWS services, Set `accessKeyId` in `WildAidDemo/services/AWS/config.json`
1. Import the code and values into your Realm app: `realm-cli import --app-id=appname-xxxxx --strategy=replace --include-dependencies`
1. Use the Realm App-Id (`appname-xxxxx`) in your [web](https://github.com/WildAid/o-fish-web), [iOS](https://github.com/WildAid/o-fish-ios), or [Android](https://github.com/WildAid/o-fish-android) apps.
1. Create a global administrative user in Realm and note the Realm ID.
1. Add a document to the wildaid.User collection - the `realmUserID` must match the `Id` field of the Realm user you created:
```js
{
    "email" : "global-admin@my-domain.com",
    "realmUserID" : "xxxxxxxxxxxxxxxxxxxxxx",
    "name" : {
        "first" : "Global",
        "last" : "Admin"
    },
    "agency" : {
        "name" : "Parque Nacional Galápagos",
        "admin" : true
    },
    "global" : {
        "admin" : true
    },
    createdOn: ISODate()
}
```
17. Enable the `recordChangeHistory` Trigger
1. Enable Users/Custom Data (ensure that cluster name = `RealmSync`, database = `wildaid`, collection = `User` and user ID field = `realmUserId`)
1. Add a `Search` index (can leave as dynamic) to the `BoardingReports` cluster through the Atlas UI
1. Optionally enable additional Triggers through the Realm UI (if you've set up your AWS credentials)
1. Enable Realm Sync "Development Mode" through the Realm UI (`Cluster Service` = `RealmSync`, `database` = `wildaid`, `partition-key` = `agency`). "Turn Dev Mode On". "Review & Deploy".


## O-FISH Project <A NAME="goals">Goals</A>
1. To modernize a paper-based system where officers board vessels and note information about the vessel, captain, crew and what's on board including gear and wildlife caught, including any violation information. 
1. To aggregate digital records for visualization, so that information may be extracted. 


## O-FISH <A NAME="components">Components</A>
WildAid's O-FISH project has several components:
1. [Android mobile application](https://github.com/WildAid/o-fish-android), used for pre-boarding search for vessel information, and on-board reporting of information
1. [iOS mobile application](https://github.com/WildAid/o-fish-ios), used for pre-boarding search for vessel information, and on-board reporting of information
1. [Web application code](https://github.com/WildAid/o-fish-web), used for website navigation and feeding Atlas Search results into MongoDB Charts
1. Realm serverless platform code (this repo_, used for backend functionality:
   1. Atlas Search queries
   1. Moving photos from the database, where Realm syncs them, to an external bucket
   1. Cryptographically secure verifiable change history
   1. MongoDB Realm Syc configuration - ensuring that the same reports can be accessed from any device
   This repository contains the Realm serverless platform code in the `WildAidDemo` directory.
1. Sample data, for use when building test environments for the project. This repository contains sample data in the `WildAidSampleBackup` directory.

## O-FISH <A NAME="infrastructure">Infrastructure</A>
![WildAid O-FISH architecture](https://webassets.mongodb.com/_com_assets/cms/architecture-zszceknhuo.png)

Photo lifecycle - a photo is captured in the mobile application and is sync'd to Atlas via Realm. When a record is inserted in the database, a trigger is fired calling a function to save the photo to an S3 bucket, removing the photo from the document in the database, and adding the URL the photo to the document. Realm synchronizes the document to all mobile devices:
![WildAid O-FISH image management architecture](https://webassets.mongodb.com/_com_assets/cms/realm-sync-tsolyndigz.gif)
