exports = function(change) {
  switch(change.operationType) {
    case 'insert':
      context.functions.execute("changeHistoryInsert", change);
      break;
    case 'replace':
      context.functions.execute("changeHistoryReplace", change);
      break;
    case 'update':
      context.functions.execute("changeHistoryUpdate", change);
      break;
    case 'delete':
      context.functions.execute("changeHistoryDelete", change);
      break;
    default:
      console.log(`Unexpected change type: ${change.operationType}`);
  }
}