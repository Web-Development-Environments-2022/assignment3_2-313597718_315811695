var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users")
      .then((users) => {
        if (users.find((x) => x.user_id === req.session.user_id)) {
          req.user_id = req.session.user_id;
          next();
        }
      })
      .catch((err) => next(err));
  } else {
    res.sendStatus(401);
  }
});

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get("/getfavorites", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipeid)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    let recpie_ids_extrcat = [];
    for (let i = 0; i < Object.keys(recipes_id).length; i++) {
      recpie_ids_extrcat.push(parseInt(recipes_id[i].recipeid));
    }

    let res1 = await recipe_utils.seenPlusFavorite(results, user_id, recpie_ids_extrcat);
    res.status(200).send(res1);
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns the recipes that were created by the logged-in user.
 */
router.get("/getMyrecipes", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.getMyrecipes(user_id);
    let recipes_id_array = []; // check what is 'elemnt' !!!?????
    recipes_id.map((element) => recipes_id_array.push(element)); //extracting the recipe into array
    //const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(recipes_id_array);
  } catch (error) {
    next(error);
  }
});

router.get("/getMyrecipesWithId", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recpie_id = req.query.recipe_id;
    const recipes_id = await user_utils.getMyrecipesWithId(user_id, recpie_id);
    let recipes_id_array = []; // check what is 'elemnt' !!!?????
    recipes_id.map((element) => recipes_id_array.push(element)); //extracting the recipe into array
    //const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(recipes_id_array);
  } catch (error) {
    next(error);
  }
});

router.get("/getFamily", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.getFamily(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element)); //extracting the recipe into array
    //const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(recipes_id_array);
  } catch (error) {
    next(error);
  }
});

/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */

// router.get("/getFullRecipe", async (req, res, next) => {
//   console.log("in /getFullRecipe in recipes.js");
//   try {

//     let id = req.query.recipe_id;
//     let user = req.session.user_id;
//     console.log("recpies id is ",id);
//     const recipe = await recipes_utils.getRecipeDetails(id, user);
//     res.send(recipe);
//   } catch (error) {
//     next(error);
//   }
// });

router.get("/addfavorites", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.query.recipeid;
    await user_utils.markAsFavorite(user_id, recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
  } catch (error) {
    next(error);
  }
});

/**
 * this path create new recipe
 */
router.post("/createRecipe", async (req, res, next) => {
  try {
    console.log(req.body.id);

    let recpiesDetials = {
      //id:req.body.id,
      title: req.body.title,
      readyInMinutes: req.body.readyInMinutes,
      image: req.body.image,
      aggregateLikes: req.body.aggregateLikes,
      vegan: req.body.vegan,
      vegetarian: req.body.vegetarian,
      glutenFree: req.body.glutenFree,
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
      numOfDishes: req.body.numOfDishes,
    };

    const results = await user_utils.createRecipe(
      req.session.user_id,
      recpiesDetials
    );
    res.status(200).send("recipe created");
  } catch (error) {
    next(error);
  }
});

/**
 * every time a user cliked on a recipe, we add it to the 'last seen' table in DB
 */
router.get("/addSeen", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    let recipeId = req.query.recipe_id;
    const x = await user_utils.addSeen(user_id, recipeId);
    res
      .status(200)
      .send(
        `New Recipe add to 'last Seen' table: Uid: '${user_id}', Rid'${recipeId}'`
      );
  } catch (error) {
    next(error);
  }
});

router.get("/lastSearch", async (req, res, next) => {
  console.log("in /lastSearch ");
  try {
    if (req.session && req.session.user_id) {
      console.log(req.session.last_search);

      res.status(200).send(req.session.last_search);
    } else {
      res.status(200).send("not found last serach");
    }
  } catch (error) {
    next(error);
  }
});
module.exports = router;
