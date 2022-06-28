const DButils = require("./DButils");

/** 
 * make a specific recipe a favorite.
 * param: user id and recipe id.
 * checks if already exist and if not, add this couple to DB.
 */

async function markAsFavorite(user_id, recipe_id) {
  let x = await DButils.execQuery(
    "SELECT recipeid as id FROM userfavrecpies"
  );
  let all = [];
  console.log(all)
  for (let i = 0; i < Object.keys(x).length; i++) {
    if (x[i].id == recipe_id) {
      return;// there is also a record of this favorie with this user.
    }
  }
  // if not exist -> insert to DB
  await DButils.execQuery(`insert into userfavrecpies values ('${user_id}',${recipe_id})`);
}

/**
 * returns all favorites recipes of the user.
 * param: user id, to pull from DB all his favorites.
*/
async function getFavoriteRecipes(user_id) {
  const recipes_id = await DButils.execQuery(`select recipeid from userfavrecpies where user_id='${user_id}'`);
  return recipes_id;
}

// create new recipe
async function createRecipe(user_id, recpiesDetials) {
  console.log(recpiesDetials);
  let x = await DButils.execQuery(
    "SELECT MAX(id) as id FROM userrecipes"
  );
  let maxid = x[0].id;
  maxid++;
  await DButils.execQuery(
    `INSERT INTO userrecipes VALUES ('${user_id}','${maxid}','${recpiesDetials.title}',
        '${recpiesDetials.readyInMinutes}', '${recpiesDetials.image}' , '${recpiesDetials.aggregateLikes}' , 
        '${recpiesDetials.vegan}' , '${recpiesDetials.vegetarian}' , '${recpiesDetials.glutenFree}' , 
        '${recpiesDetials.ingredients}', '${recpiesDetials.instructions}', '${recpiesDetials.numOfDishes}')`
  );
}

// returns all the created recipes by this user id
async function getMyrecipes(user_id) {
  const recipes_id = await DButils.execQuery(`select * from userrecipes where user_id='${user_id}'`);
  return recipes_id;
}
async function getMyrecipesWithId(user_id,recpie_id){
  const recipes_id = await DButils.execQuery(`select * from userrecipes where user_id='${user_id}' and id='${recpie_id}'`);
  return recipes_id;
}

// returns all the created family recipes of this user id
async function getFamily(user_id) {
  const recipes = await DButils.execQuery(`select * from userfamilyrecipes where user_id='${user_id}'`);
  return recipes;
}

// returns all the created recipes by this user id
async function addSeen(user_id, recipe_id) {
  await DButils.execQuery(`INSERT INTO lastseen VALUES('${user_id}','${recipe_id}',NOW()) ON DUPLICATE KEY UPDATE date=NOW()`);
  //`insert into lastseen values ('${username}','${recipe_id}',NOW()) ON DUPLICATE KEY UPDATE time=NOW()`
}

// checks if the user watched the full recipe with this id
async function checkSeen(user_id, recipe_id) {
  console.log("in check seen");
  const ans = await DButils.execQuery(`SELECT * FROM lastseen WHERE user_id='${user_id}' AND recipe_id='${recipe_id}'`);
  console.log(ans)  //`insert into lastseen values ('${username}','${recipe_id}',NOW()) ON DUPLICATE KEY UPDATE time=NOW()`
  return ans;
}

exports.markAsFavorite = markAsFavorite;
exports.createRecipe = createRecipe;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getMyrecipes = getMyrecipes;
exports.addSeen = addSeen;
exports.checkSeen = checkSeen;
exports.getFamily = getFamily;
exports.getMyrecipesWithId=getMyrecipesWithId;