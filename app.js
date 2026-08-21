const STORAGE_KEY = 'bakecost-beta-recipe-v3';
const RECIPES_KEY = 'bakecost-beta-saved-recipes-v1';
const defaults = {
  ingredients: [
    { id:'flour', name:'All-purpose flour', size:1000, unit:'g', price:4.5 },
    { id:'cocoa', name:'Cocoa powder', size:250, unit:'g', price:7.5 },
    { id:'butter', name:'Butter', size:250, unit:'g', price:8 },
    { id:'eggs', name:'Eggs', size:10, unit:'unit', price:6.5 }
  ],
  packaging: [
    { id:'box', name:'Cake box', size:1, unit:'unit', price:2.8 },
    { id:'board', name:'Cake board', size:1, unit:'unit', price:1.1 }
  ],
  recipeIngredients: [{ pantryId:'flour', used:250 }, { pantryId:'cocoa', used:70 }, { pantryId:'butter', used:225 }, { pantryId:'eggs', used:4 }],
  recipePackaging: [{ pantryId:'box', used:1 }, { pantryId:'board', used:1 }]
};
const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
const savedRecipes = JSON.parse(localStorage.getItem(RECIPES_KEY) || '[]');
const state = saved || structuredClone(defaults);
let currentRecipeId = null;
const pantryTemplate = document.querySelector('#pantryRowTemplate');
const recipeTemplate = document.querySelector('#recipeRowTemplate');
const money = value => `RM${value.toFixed(2)}`;
const getItem = (type, id) => state[type].find(item => item.id === id);
const lineCost = (type, line) => { const item = getItem(type, line.pantryId); return item ? line.used * item.price / Math.max(item.size, 1) : 0; };
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, recipeName: recipeName.value, yield: yieldInput.value, sellingPrice: sellingPrice.value })); }
function showSaved(statusId, message = 'Saved') { const status = document.querySelector(statusId); status.textContent = message; window.setTimeout(() => { if (status.textContent === message) status.textContent = ''; }, 2500); }
function activateTab(view) { document.querySelectorAll('[data-tab]').forEach(link => link.classList.toggle('active', link.dataset.tab === view)); document.querySelectorAll('[data-view]').forEach(section => section.classList.toggle('active', section.dataset.view === view)); }
function renderSavedRecipes() {
  const list = document.querySelector('#savedRecipes'); list.innerHTML = '';
  if (!savedRecipes.length) { list.innerHTML = '<p class="empty-state">No saved recipes yet. Create one in the Recipe calculator, then tap Save recipe.</p>'; return; }
  savedRecipes.slice().sort((a, b) => b.savedAt - a.savedAt).forEach(recipe => {
    const card = document.createElement('article'); card.className = 'saved-recipe';
    const date = new Date(recipe.savedAt).toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' });
    card.innerHTML = `<div><h3>${escapeHtml(recipe.name || 'Untitled recipe')}</h3><p>${recipe.yield} cakes · Selling at ${money(Number(recipe.sellingPrice) || 0)} · Saved ${date}</p></div><div class="saved-recipe-actions"><button class="ghost-button open-recipe">Open</button><button class="text-button delete-recipe">Delete</button></div>`;
    card.querySelector('.open-recipe').addEventListener('click', () => openRecipe(recipe));
    card.querySelector('.delete-recipe').addEventListener('click', () => { if (!confirm(`Delete ${recipe.name || 'this recipe'}?`)) return; savedRecipes.splice(savedRecipes.findIndex(item => item.id === recipe.id), 1); localStorage.setItem(RECIPES_KEY, JSON.stringify(savedRecipes)); renderSavedRecipes(); });
    list.appendChild(card);
  });
}
function escapeHtml(value) { const node = document.createElement('div'); node.textContent = value; return node.innerHTML; }
function openRecipe(recipe) { state.recipeIngredients.splice(0, state.recipeIngredients.length, ...structuredClone(recipe.recipeIngredients)); state.recipePackaging.splice(0, state.recipePackaging.length, ...structuredClone(recipe.recipePackaging)); recipeName.value = recipe.name || 'Untitled recipe'; yieldInput.value = recipe.yield || 1; sellingPrice.value = recipe.sellingPrice ?? 0; currentRecipeId = recipe.id; renderAll(); activateTab('recipe'); showSaved('#recipeSaveStatus', 'Recipe opened'); }
function saveRecipe() { const record = { id: currentRecipeId || crypto.randomUUID(), name: recipeName.value.trim() || 'Untitled recipe', yield: yieldInput.value, sellingPrice: sellingPrice.value, recipeIngredients: structuredClone(state.recipeIngredients), recipePackaging: structuredClone(state.recipePackaging), savedAt: Date.now() }; const index = savedRecipes.findIndex(recipe => recipe.id === record.id); if (index === -1) savedRecipes.push(record); else savedRecipes[index] = record; currentRecipeId = record.id; localStorage.setItem(RECIPES_KEY, JSON.stringify(savedRecipes)); save(); renderSavedRecipes(); showSaved('#recipeSaveStatus', 'Recipe saved'); }
function startNewRecipe() { state.recipeIngredients.splice(0); state.recipePackaging.splice(0); recipeName.value = 'Untitled recipe'; yieldInput.value = 1; sellingPrice.value = 0; currentRecipeId = null; renderAll(); activateTab('recipe'); }
function renderPantry(type, listId, label) {
  const list = document.querySelector(listId); list.innerHTML = '';
  state[type].forEach((item, index) => {
    const row = pantryTemplate.content.cloneNode(true).querySelector('.pantry-row');
    row.querySelector('.item-label').firstChild.textContent = label;
    row.querySelector('.name').value = item.name; row.querySelector('.package-size').value = item.size; row.querySelector('.unit').value = item.unit; row.querySelector('.package-price').value = item.price;
    const showRate = () => row.querySelector('.pantry-rate').textContent = `RM${(item.price / Math.max(item.size, 1)).toFixed(3)} / ${item.unit}`;
    showRate();
    row.querySelectorAll('input,select').forEach(field => field.addEventListener('input', () => { item.name = row.querySelector('.name').value; item.size = Number(row.querySelector('.package-size').value) || 0; item.unit = row.querySelector('.unit').value; item.price = Number(row.querySelector('.package-price').value) || 0; showRate(); renderRecipeLines(type); update(); save(); }));
    row.querySelector('.remove').addEventListener('click', () => { state[type].splice(index, 1); const lines = type === 'ingredients' ? state.recipeIngredients : state.recipePackaging; for (let i = lines.length - 1; i >= 0; i--) if (!getItem(type, lines[i].pantryId)) lines.splice(i, 1); renderAll(); });
    list.appendChild(row);
  });
}
function renderRecipeLines(type) {
  const list = document.querySelector(type === 'ingredients' ? '#ingredientList' : '#packagingList');
  const lines = type === 'ingredients' ? state.recipeIngredients : state.recipePackaging;
  list.innerHTML = '';
  lines.forEach((line, index) => {
    const row = recipeTemplate.content.cloneNode(true).querySelector('.recipe-ingredient-row');
    const select = row.querySelector('.item-select'); row.querySelector('.recipe-item-label').textContent = type === 'ingredients' ? 'Ingredient' : 'Packaging';
    state[type].forEach(item => select.add(new Option(item.name, item.id, false, item.id === line.pantryId)));
    const source = getItem(type, line.pantryId); row.querySelector('.used').value = line.used; row.querySelector('.recipe-unit').textContent = source?.unit || ''; row.querySelector('.row-total').textContent = money(lineCost(type, line));
    select.addEventListener('change', () => { line.pantryId = select.value; renderRecipeLines(type); update(); save(); });
    row.querySelector('.used').addEventListener('input', () => { line.used = Number(row.querySelector('.used').value) || 0; row.querySelector('.row-total').textContent = money(lineCost(type, line)); update(); save(); });
    row.querySelector('.remove').addEventListener('click', () => { lines.splice(index, 1); renderAll(); }); list.appendChild(row);
  });
}
function update() {
  const ingredientTotal = state.recipeIngredients.reduce((sum, line) => sum + lineCost('ingredients', line), 0);
  const packagingTotal = state.recipePackaging.reduce((sum, line) => sum + lineCost('packaging', line), 0);
  const batchTotal = ingredientTotal + packagingTotal; const count = Math.max(Number(yieldInput.value) || 1, 1); const perItem = batchTotal / count; const price = Number(sellingPrice.value) || 0;
  document.querySelector('#ingredientTotal').textContent = money(ingredientTotal); document.querySelector('#packagingTotal').textContent = money(packagingTotal); document.querySelector('#batchTotal').textContent = money(batchTotal); document.querySelector('#costPerItem').textContent = perItem.toFixed(2); document.querySelector('#profit').textContent = money(price - perItem); document.querySelector('#margin').textContent = price > 0 ? `${((price - perItem) / price * 100).toFixed(1)}%` : '0%';
}
function renderAll() { renderPantry('ingredients', '#pantryList', 'Ingredient'); renderPantry('packaging', '#packagingPantryList', 'Packaging'); renderRecipeLines('ingredients'); renderRecipeLines('packaging'); renderSavedRecipes(); update(); save(); }
const recipeName = document.querySelector('#recipeName'), yieldInput = document.querySelector('#yield'), sellingPrice = document.querySelector('#sellingPrice');
if (saved) { recipeName.value = saved.recipeName || 'Untitled recipe'; yieldInput.value = saved.yield || 1; sellingPrice.value = saved.sellingPrice ?? 0; }
function addToPantry(type) { state[type].push({ id:crypto.randomUUID(), name:`New ${type === 'ingredients' ? 'ingredient' : 'packaging'}`, size:1, unit:'unit', price:0 }); renderAll(); }
document.querySelector('#addPantryIngredient').addEventListener('click', () => addToPantry('ingredients')); document.querySelector('#addPantryPackaging').addEventListener('click', () => addToPantry('packaging'));
document.querySelector('#addIngredient').addEventListener('click', () => { if (state.ingredients.length) { state.recipeIngredients.push({ pantryId:state.ingredients[0].id, used:0 }); renderAll(); } }); document.querySelector('#addPackaging').addEventListener('click', () => { if (state.packaging.length) { state.recipePackaging.push({ pantryId:state.packaging[0].id, used:0 }); renderAll(); } });
[recipeName, yieldInput, sellingPrice].forEach(field => field.addEventListener('input', () => { update(); save(); }));
document.querySelector('#saveRecipe').addEventListener('click', saveRecipe);
document.querySelector('#saveIngredients').addEventListener('click', () => { save(); showSaved('#ingredientSaveStatus', 'Ingredients saved'); });
document.querySelector('#savePackaging').addEventListener('click', () => { save(); showSaved('#packagingSaveStatus', 'Packaging saved'); });
document.querySelector('#newRecipe').addEventListener('click', () => { if (!confirm('Start a new recipe? Both pantries stay saved.')) return; startNewRecipe(); });
document.querySelector('#createRecipe').addEventListener('click', startNewRecipe);
document.querySelectorAll('[data-tab]').forEach(tab => tab.addEventListener('click', event => { event.preventDefault(); activateTab(tab.dataset.tab); }));
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
renderAll();
