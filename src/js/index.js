import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Like from './models/Like';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likeView from './views/likeView';
import { elements, renderLoader, clearLoader } from './views/base';

// Global state of the app
const state = {};

// Like controller

const controlLike = () => {
  if (!state.likes) state.likes = new Like();
  const currentID = state.recipe.id;

  state.likes.isLiked(currentID);

  if (!state.likes.isLiked(currentID)) {

    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.image
    );

    likeView.toggleLikeBtn(true);
    likeView.renderLike(newLike);

  } else {

    state.likes.deleteLike(currentID);
    likeView.toggleLikeBtn(false);
    likeView.deleteLike(currentID);

  }

  likeView.toggleLikeMenu(state.likes.getNumLikes());
}

// Search controller
const controlSearch = async () => {
  // 1. Get query from the view
  const query = searchView.getInput();

  if (query) {
    // 2. Adding new object to the state
    state.search = new Search(query);

    // 3. Preparing UI for render
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);
    try {
      // 4. Search for results
      await state.search.getResults();

      // 5. Redner result to the UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (error) {
      console.log(error);
      clearLoader();
    }
  }
}

elements.searchForm.addEventListener('submit', e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
  e.preventDefault;
  const btn = e.target.closest('.btn-inline');
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
})

// Recipe controller
const controlRecipe = async () => {
  const id = window.location.hash.replace('#', '');

  if (id) {
    //  Prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    if (state.search) searchView.highlightSelected(id);

    // Create new recipe object
    state.recipe = new Recipe(id);
    try {
      // Get recipe data and parse ingredients
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      // Calculate servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      //  Render the recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      console.log(error);
    }
  }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

//  List controller

window.addEventListener('load', () => {
  state.likes = new Like();
  state.likes.readStorage();
  likeView.toggleLikeMenu(state.likes.getNumLikes());
  state.likes.likes.forEach(like => likeView.renderLike(like));
})

const controlList = () => {
  if (!state.list) state.list = new List();

  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
}

elements.shopping.addEventListener('click', e => {
  const id = e.target.closest('.shopping__item').dataset.itemid;

  if (e.target.matches('.shopping__delete, .shopping__delete *')) {
    state.list.deleteItem(id);
    listView.deleteItem(id);
  } else if (e.target.matches('.shopping__count-value')) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

elements.recipe.addEventListener('click', e => {

  if (e.target.matches('.btn-decrease, .btn-decrease *')) {

    if (state.recipe.servings > 1) {
      state.recipe.updateServings('dec')
      recipeView.updateServingsIngredietns(state.recipe);
    }

  } else if (e.target.matches('.btn-increase, .btn-increase *')) {
    state.recipe.updateServings('inc');
    recipeView.updateServingsIngredietns(state.recipe);
  } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
    controlList();
  } else if (e.target.matches('.recipe__love, .recipe__love *')) {
    controlLike();
  }
});
