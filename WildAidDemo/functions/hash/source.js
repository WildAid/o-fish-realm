exports = function(doc){
  /*
    Accessing application's values:
    var x = context.values.get("value_name");

    Accessing a mongodb service:
    var collection = context.services.get("mongodb-atlas").db("dbname").collection("coll_name");
    var doc = collection.findOne({owner_id: context.user.id});

    To call other named functions:
    var result = context.functions.execute("function_name", arg1, arg2);

    Try running in the console below.
  */
  const md5 = require("crypto-js/md5");
  const docString = JSON.stringify(doc)
  const hash = md5(docString);
  
  console.log(`doc: ${doc}`);
  console.log(`docString: ${docString}`);
  console.log(`hash: ${hash}`);
  
  return hash;
};