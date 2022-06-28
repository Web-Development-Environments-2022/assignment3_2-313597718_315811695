const axios = require("axios");
const { response } = require("express");
const api_domain = "https://api.spoonacular.com/recipes";
const MySql = require("MySql");
const DButils = require("../utils/DButils");
const user_utils = require("./user_utils");

/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info
 */

/**
 * @param {*} recipe_id
 * @returns full information about the recipe with this id.
 */
async function getRecipeInformation(recipe_id) {
  console.log("in getRecipeInformation in recipes_utills.js");

  return await axios.get(`${api_domain}/${recipe_id}/information`, {
    params: {
      includeNutrition: false,
      apiKey: process.env.spooncular_apiKey,
    },
  });
}

/**
 * @param {*} recipe_id
 * @returns put all tha data from the server in local var and returns it.
 */
async function getRecipeDetails(recipe_id, user_id) {
  let recipe_info = await getRecipeInformation(recipe_id);

  let recipeAll = await seenPlusFavorite([recipe_info.data], user_id, [
    recipe_id,
  ]);
  console.log("go to add seen");
  user_utils.addSeen(user_id, recipe_id);

  let {
    id,
    title,
    image,
    servings,
    readyInMinutes,
    aggregateLikes,
    glutenFree,
    instructions,
    vegan,
    vegetarian,
    extendedIngredients,
    analyzedInstructions,
    seen,
    favorite,
  } = recipeAll[0];

  return {
    id: id,
    title: title,
    image: image,
    servings: servings,
    readyInMinutes: readyInMinutes,
    aggregateLikes: aggregateLikes,
    glutenFree: glutenFree,
    instructions: instructions,
    vegan: vegan,
    vegetarian: vegetarian,
    extendedIngredients: extendedIngredients,
    analyzedInstructions: analyzedInstructions,
    seen: seen,
    favorite: favorite,
  };
}

/**
 * @returns 3 random recipes from the server.
 */
async function getRandomRecipes(user_id) {
  const response = await axios.get(`${api_domain}/random`, {
    // get 10 overall but pick only 3 with image
    params: {
      number: 10,
      apiKey: process.env.spooncular_apiKey,
    },
  });
  let flag = 0;
  let onlyWithImage = [];
  for (let i = 0; i < Object.keys(response).length; i++) {
    if (response.data.recipes[i].image != undefined) {
      onlyWithImage.push(response.data.recipes[i]);
      flag += 1;
    }
    if (flag == 3) {
      break;
    }
  }
  console.log(onlyWithImage);
  let previewRecips = extractPreviewRecipeDetails(onlyWithImage);
  let idsLst = [previewRecips[0].id, previewRecips[1].id, previewRecips[2].id];
  let res = seenPlusFavorite(previewRecips, user_id, idsLst);
  return res;
}

/**
 *
 * @param {*} recipes_info
 * @returns preview of all the rescipes in this list of ids.
 */
function extractPreviewRecipeDetails(recipes_info) {
  return recipes_info.map((recipe_info) => {
    //check the data type so it can work with diffrent types of data ??
    let data = recipe_info;
    if (recipe_info.data) {
      data = recipe_info.data;
    }
    const {
      id,
      title,
      readyInMinutes,
      image,
      aggregateLikes,
      vegan,
      vegetarian,
      glutenFree,
    } = data;
    return {
      id: id,
      title: title,
      image: image,
      readyInMinutes: readyInMinutes,
      aggregateLikes: aggregateLikes,
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree,
    };
  });
}

/**
 *
 * @param {*} numOfResult   : how many reslut do i want to return to my search.
 * @param {*} queryToSearch : the word/term/food i want to find.
 * @param {*} cuisine       : list to filter by.
 * @param {*} diet          : list to filter by.
 * @param {*} intolarence   : list to filter by.
 * @returns
 */
async function searchRecpies(
  user_id,
  numOfResult,
  queryToSearch,
  cuisine,
  diet,
  intolerances
) {
  //https://spoonacular.com/food-api/docs#Search-Recipes-Complex
  //TODO: need to makesure that all recpies have instracution, amonut of recpies return, filter\order and etc. check hw3 pdf
  const response = await axios.get(`${api_domain}/complexSearch`, {
    // this get/post
    params: {
      query: queryToSearch,
      number: 20,//new ohad
      cuisine: cuisine,
      diet: diet,
      intolerances: intolerances,
      instructionsRequired: true,
      apiKey: process.env.spooncular_apiKey,
    },
  });

  let x = response.data.results;
  let ids = [];

  //go throw all ids.
  for (let i = 0; i < Object.keys(x).length; i++) {
    ids.push(x[i].id);
  }
  // call for get Recipes Preview.
  let fullR = getRecipesPreview(ids, user_id, numOfResult);//numOfResult
  return fullR; // the filtring will take place in the frontend

  /** example:
   * fullR:=:  "id": 654812,"title": "Pasta and Seafood", "image": "https://spoonacular.com/recipeImages/654812-556x370.jpg",
        "readyInMinutes": 45,"popularity": 1,"vegan": false,"vegetarian": false,"glutenFree": false
   */
}

/**
 * @param {*} recipes_ids_list
 * @returns preview of recipes
 * check also if the user have seen this recipe before, and if add it to his favorites.
 */
async function getRecipesPreview(recipes_ids_list, user_id, numOfResult) {
  let promises = [];
  recipes_ids_list.map((id) => {
    promises.push(getRecipeInformation(id));
  });
  let info_res = await Promise.all(promises);
  let new_res = [];
  let new_lst = [];
  cnt = 0;
  for (let i = 0; i < Object.keys(info_res).length; i++) {
    if (info_res[i].data.instructions != "" && info_res[i].data.image != undefined) {
      new_res.push(info_res[i]);
      cnt++;
      new_lst.push(parseInt(info_res[i].data.id));
    }
    if (cnt == numOfResult) { break; }
  }
  let recipe = extractPreviewRecipeDetails(new_res);//info_res
  let res = seenPlusFavorite(recipe, user_id, new_lst);//recipes_ids_list

  console.log("get preview: ", res);
  return res;
}

async function seenPlusFavorite(recipe, user_id, recipes_ids_list) {
  let ids = recipes_ids_list;
  if (user_id == null) {
    return recipe;
  }
  for (let i = 0; i < Object.keys(ids).length; i++) {
    const f = await user_utils.checkSeen(user_id, ids[i]);
    if (f[0] == null) {
      recipe[i]["seen"] = false;
    } else {
      recipe[i]["seen"] = true;
    }
  }

  // call for func that check if this user saved those recipes to favorites.
  const f = await user_utils.getFavoriteRecipes(user_id);
  for (let i = 0; i < Object.keys(ids).length; i++) {
    for (let j = 0; j < Object.keys(f).length; j++) {
      // if this recipe is in favList then add true as favorite.
      if (f[j].recipeid == ids[i]) {
        recipe[i]["favorite"] = true;
        break;
      }
    }
  }
  // for each recipe that doesn't gets the true, now will get the false.
  for (let i = 0; i < Object.keys(ids).length; i++) {
    if (recipe[i]["favorite"] != true) {
      recipe[i]["favorite"] = false;
    }
  }
  return recipe;
}

// return 3 last seen recipes of this user.
async function getLast3(user_id) {
  let threeLast = [];
  //const user_id = req.session.user_id;
  // go to DB table "lastSeen" -> user_id,recipe_id,date-> filter all recipeID of this user_id-> order by date-> take the newest 3.
  let x = await DButils.execQuery(
    `SELECT * FROM lastseen where user_id='${user_id}' ORDER BY date DESC LIMIT 3`
  );
  for (let i = 0; i < Object.keys(x).length; i++) {
    threeLast.push(x[i].recipe_id);
  }
  let prev3 = getRecipesPreview(threeLast, 3);
  return prev3;
}

exports.getRecipeDetails = getRecipeDetails;
exports.getRandomRecipes = getRandomRecipes;
exports.getRecipesPreview = getRecipesPreview;
exports.searchRecpies = searchRecpies;
exports.getLast3 = getLast3;
exports.seenPlusFavorite=seenPlusFavorite;
