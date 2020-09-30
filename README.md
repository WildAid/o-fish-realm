# MongoDB Realm Application for WildAid's O-FISH project

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

<BR><BR>Developers are expected to follow the <A HREF="https://www.mongodb.com/community-code-of-conduct">MongoDB Community Code of Conduct</A> guidelines.

This repo implements the O-FISH Realm serverless backend application and contains sample data. The `WildAidSampleBackup` directory contains a `mongodump` of the database, suitable for building and testing. The `WildAidDemo` directory contains the serverless functions, triggers, values, Realm Sync rules and other code that makes up the backend for the [web](https://github.com/WildAid/o-fish-web), [iOS](https://github.com/WildAid/o-fish-ios) and [Android](https://github.com/WildAid/o-fish-android) applications - together with the connection to the associated MongoDB Atlas database.


## <A NAME="O-FISHinstall">O-FISH Installation</A>
See the [O-FISH installation guide](https://wildaid.github.io/), which includes instructions for using this repository in the context of building the O-FISH application.

## <A NAME="standalone">Import this repository as standalone code</a>
### How to import and configure your own MongoDB Realm app

1. [Create](https://wildaid.github.io/foundation/2020/06/09/Atlas-Database.html) an Atlas Cluster.
1. [Configure](https://wildaid.github.io/foundation/2020/06/09/Atlas-Database-config.html) your Atlas Cluster.
1. [Import sample data](https://wildaid.github.io/foundation/2020/06/09/Data-Import.html) (use `WildAidMinimalBackup` if you don't need thousands of sample documents), and add a Search index to the BoardingReports collection.
1. [Create the Realm App](https://wildaid.github.io/foundation/2020/06/09/Create-Realm.html).
1. Take a note of the Realm App-Id `appname-xxxxx` 
1. [Generate an API key pair](https://wildaid.github.io/foundation/2020/06/09/Realm-API-Key.html) for your project and note the public and private IDs. Whitelist your IP address for API access.
1. Install `realm-cli`: `npm install -g mongodb-realm-cli`
1. Log in to your Atlas/Realm project: `realm-cli login --api-key=my-api-key --private-api-key=my-private-api-key`
1. Add your AWS private API key to your app as a Realm Secret: `realm-cli secrets add --app-id=appname-xxxxx --name=AWS-secret-key --value=my-aws-secret-api-key` - If you are NOT connecting your instance with AWS, you STILL need to run this command but --value can be set to any string.
1. [Import the Realm Code](https://wildaid.github.io/foundation/2020/06/09/Import-Realm-Code.html)
1. [Create a global administrative user in Realm](https://wildaid.github.io/foundation/2020/06/09/Connect-Realm-With-Data.html) and add the information to the User collection.
1. Use the Realm App-Id (`appname-xxxxx`) in your [web](https://github.com/WildAid/o-fish-web), [iOS](https://github.com/WildAid/o-fish-ios), or [Android](https://github.com/WildAid/o-fish-android) apps.
1. [Enable Realm Sync through the Realm UI](https://wildaid.github.io/web/2020/06/09/Prepare-Web-App.html)<BR>
Before activating sync, you can add extra security by adding this extra rule to the read and write permissions: `{ "%%user.custom_data.agency.name": "%%partition" }`.
1. Enable Users/Custom Data (ensure that cluster name = `RealmSync`, database = `wildaid`, collection = `User` and user ID field = `realmUserId`)
1. Optionally enable additional Triggers through the Realm UI (if you've set up your AWS credentials)
1. If you want to allow anonymous users to create a new account and agency (only intended for shared development environments/sandboxes), then enable Anonymous Authentication and set the `developerMode` Realm value to `ture` so that the `regNewAgency` function can be called from the web app.


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

