# MongoDB Realm Application for WildAid

The [WildAid Marine Program](https://marine.wildaid.org/) work to protect vulnerable marine environments.

O-FISH (Officer Fishery Information Sharing Hub) is a multi-platform application that enables officers to browse and record boarding report data from their mobile devices.

This repo implements the O-FISH Realm serverless backend application.

Details on installing all applications making up the solution can be found [here](http://wildaid.github.io/).

## Import and configure your own MongoDB Realm app

1. Create your [Atlas Cluster](https://cloud.mongodb.com) and [Realm App](https://cloud.mongodb.com). **Do not import sample data yet**
1. Take a note of the Realm App-Id `appname-xxxxx` 
1. Generate an API key pair for your project and note the public and private IDs (Access Manager/Project) from the Atlas UI
1. Whitelist your IP address for API access (through the Atlas UI)
1. Install `stitch-cli`: `npm install -g mongodb-stitch-cli`
1. Log in to your Atlas/Realm project: `stitch-cli login --api-key=my-api-key --private-api-key=my-private-api-key`
1. Add your AWS private API key to your app as a Realm Secret: `stitch-cli secrets add --app-id=appname-xxxxx --name=AWS-secret-key --value=my-aws-secret-api-key` - Just use a dummy string if you are not planning on using AWS services
1. Download the Realm app code: `git clone https://github.com/WildAid/o-fish-realm.git`
1. `cd o-fish-realm/WildAidDemo`
1. Add in the App name (from step 1) in the "name" field in `stitch.json` and add the cluster name to the "clusterName" field in `services/RealmSync/config.json` and `services/mongodb-atlas/config.json` files
1. If using AWS services, edit the values in `values/awsRegion.json`, `values/destinationEmailAddress.json` and `values/sourceEmailAddress.json`
1. If using AWS services, Set `accessKeyId` in `WildAidDemo/services/AWS/config.json`
1. Import the code and values into your Realm app: `stitch-cli import --app-id=appname-xxxxx --strategy=replace --include-dependencies`
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
    }
}
```
17. Enable "Custom User Data" under "Users"
1. Enable the `recordChangeHistory` Trigger
1. Optionally enable additional Triggers through the Realm UI (if you've set up your AWS credentials)
1. Enable Realm Sync "Development Mode" through the Stitch UI (`Cluster Service` = `RealmSync`, `database` = `wildaid`, `partition-key` = `agency`). "Turn Dev Mode On". "Review & Deploy".
1. Optionaly, import sample data
