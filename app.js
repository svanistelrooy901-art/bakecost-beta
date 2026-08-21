const STORAGE_KEY = 'bakecost-beta-recipe';
const defaultIngredients = [
  { name: 'All-purpose flour', used: 250, unit: 'g', cost: 0.0045 },
  { name: 'Cocoa powder', used: 70, unit: 'g', cost: 0.03 },
  { name: 'Butter', used: 225, unit: 'g', cost: 0.032 },
  { name: 'Eggs', used: 4, unit: 'unit', cost: 0.65 }
];
const defaultPackaging = [
  { name: 'Cake box', used: 1, unit: 'unit', cost: 2.8 },
  { name: 'Cake board', used: 1, unit: 'unit', cost: 1.1 }
];
const savedRecipe = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
const ingredients = savedRecipe?.ingredients || defaultIngredients;
const packaging = savedRecipe?.packaging || defaultPackaging;
const template = document.querySelector('#costRowTemplate');

function saveRecipe() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    recipeName: document.querySelector('#recipeName').value,
    yield: document.querySelector('#yield').value,
    sellingPrice: document.querySelector('#sellingPrice').value,
    ingredients,
    packaging
  }));
}

function render(list, data) {
  list.innerHTML = '';
  data.forEach((item, index) => {
    const fragment = template.content.cloneNode(true);
    const row = fragment.querySelector('.cost-row');
    row.querySelector('.name').value = item.name;
    row.querySelector('.used').value = item.used;
    row.querySelector('.unit').value = item.unit;
    row.querySelector('.unit-cost').value = item.cost;
    row.querySelectorAll('input, select').forEach(input => input.addEventListener('input', () => {
      item.name = row.querySelector('.name').value;
      item.used = Number(row.querySelector('.used').value) || 0;
      item.unit = row.querySelector('.unit').value;
      item.cost = Number(row.querySelector('.unit-cost').value) || 0;
      update(); saveRecipe();
    }));
    row.querySelector('.remove').addEventListener('click', () => { data.splice(index, 1); renderAll(); });
    list.appendChild(fragment);
  });
  update(); saveRecipe();
}
function money(value) { return `RM${value.toFixed(2)}`; }
function total(items) { return items.reduce((sum, item) => sum + item.used * item.cost, 0); }
function update() {
  const ingredientCost = total(ingredients);
  const packagingCost = total(packaging);
  const batchTotal = ingredientCost + packagingCost;
  const yieldCount = Math.max(Number(document.querySelector('#yield').value) || 1, 1);
  const perItem = batchTotal / yieldCount;
  const sellingPrice = Number(document.querySelector('#sellingPrice').value) || 0;
  document.querySelector('#ingredientTotal').textContent = money(ingredientCost);
  document.querySelector('#packagingTotal').textContent = money(packagingCost);
  document.querySelector('#batchTotal').textContent = money(batchTotal);
  document.querySelector('#costPerItem').textContent = perItem.toFixed(2);
  document.querySelector('#profit').textContent = money(sellingPrice - perItem);
  document.querySelector('#margin').textContent = sellingPrice > 0 ? `${((sellingPrice - perItem) / sellingPrice * 100).toFixed(1)}%` : '0%';
  document.querySelectorAll('.cost-row').forEach((row, index) => {
    const source = [...document.querySelector('#ingredientList').children, ...document.querySelector('#packagingList').children][index];
  });
  document.querySelectorAll('#ingredientList .cost-row').forEach((row, i) => row.querySelector('.row-total').textContent = money(ingredients[i].used * ingredients[i].cost));
  document.querySelectorAll('#packagingList .cost-row').forEach((row, i) => row.querySelector('.row-total').textContent = money(packaging[i].used * packaging[i].cost));
}
function renderAll() { render(document.querySelector('#ingredientList'), ingredients); render(document.querySelector('#packagingList'), packaging); }
document.querySelector('#addIngredient').addEventListener('click', () => { ingredients.push({name:'New ingredient',used:0,unit:'g',cost:0}); renderAll(); });
document.querySelector('#addPackaging').addEventListener('click', () => { packaging.push({name:'New packaging',used:1,unit:'unit',cost:0}); renderAll(); });
document.querySelector('#yield').addEventListener('input', () => { update(); saveRecipe(); });
document.querySelector('#sellingPrice').addEventListener('input', () => { update(); saveRecipe(); });
document.querySelector('#recipeName').addEventListener('input', saveRecipe);
document.querySelector('#newRecipe').addEventListener('click', () => {
  if (!confirm('Start a new recipe? Your current recipe stays saved on this device.')) return;
  document.querySelector('#recipeName').value = 'Untitled recipe';
  ingredients.splice(0, ingredients.length);
  packaging.splice(0, packaging.length);
  document.querySelector('#yield').value = 1;
  document.querySelector('#sellingPrice').value = 0;
  renderAll(); saveRecipe(); document.querySelector('#recipeName').focus(); document.querySelector('#recipeName').select();
});
if (savedRecipe) {
  document.querySelector('#recipeName').value = savedRecipe.recipeName || 'Untitled recipe';
  document.querySelector('#yield').value = savedRecipe.yield || 1;
  document.querySelector('#sellingPrice').value = savedRecipe.sellingPrice || 0;
}
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
renderAll();
