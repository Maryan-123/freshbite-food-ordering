/* ===========================================================
   FreshBite - Restaurant Menu Page
   Reads restaurantId from the URL, renders restaurant info,
   and lists that restaurant's food items with search/filter/sort.
   =========================================================== */

let currentRestaurant = null;
let currentRestaurantItems = [];

document.addEventListener("DOMContentLoaded", () => {
  const hasIdParam = new URLSearchParams(window.location.search).has("restaurantId");
  const restaurantId = getRestaurantIdFromUrl();

  // No restaurant specified (e.g. the nav "Menu" link) - default to the first restaurant
  currentRestaurant = hasIdParam
    ? restaurants.find((r) => r.id === restaurantId)
    : restaurants[0];

  if (!currentRestaurant) {
    renderMissingRestaurant();
    return;
  }

  currentRestaurantItems = foodItems.filter((f) => f.restaurantId === currentRestaurant.id);

  renderRestaurantHeader(currentRestaurant);
  populateCategoryOptions();
  renderMenuSkeletonCards("foodGrid", 6);

  // Short simulated delay to demonstrate the skeleton loading state.
  setTimeout(() => {
    applyMenuFiltersAndRender();
  }, 300);

  setupFilterToggle();
  setupMenuFilterListeners();
  setupClearFilters();
  renderRestaurantReviews(currentRestaurant.id);
});

/* ---------- Skeleton Loading State ---------- */
function renderMenuSkeletonCards(containerId, count) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = Array.from({ length: count })
    .map(
      () => `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton-block skeleton-image"></div>
        <div class="skeleton-block skeleton-line skeleton-line-title"></div>
        <div class="skeleton-block skeleton-line skeleton-line-short"></div>
      </div>`
    )
    .join("");
}

/* ---------- URL Parsing ---------- */
function getRestaurantIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get("restaurantId"));
}

/* ---------- Restaurant Not Found ---------- */
function renderMissingRestaurant() {
  document.getElementById("restaurantHeader").innerHTML = `
    <div class="container">
      <div class="no-results">
        <i class="fa-solid fa-shop-slash"></i>
        <h3>Restaurant not found</h3>
        <p>The restaurant you're looking for doesn't exist or the link is invalid.</p>
        <a href="restaurants.html" class="btn btn-primary">Browse Restaurants</a>
      </div>
    </div>`;
  document.getElementById("resultsCount").textContent = "";
}

/* ---------- Render Restaurant Header ---------- */
function renderRestaurantHeader(r) {
  const header = document.getElementById("restaurantHeader");
  header.innerHTML = `
    <div class="restaurant-cover">
      <img src="${r.image}" alt="${r.name} cover" loading="lazy" />
    </div>
    <div class="container restaurant-header-info">
      <img src="${r.logo}" alt="${r.name} logo" class="restaurant-logo" loading="lazy" />
      <div class="restaurant-header-text">
        <div class="restaurant-header-top">
          <h1>${r.name}</h1>
          <span class="status-badge ${r.isOpen ? "status-open" : "status-closed"}">
            ${r.isOpen ? "Open Now" : "Closed"}
          </span>
        </div>
        <p class="restaurant-cuisine">${r.cuisine}</p>
        <p class="restaurant-description">${r.description}</p>
        <div class="restaurant-meta">
          <span><i class="fa-solid fa-star"></i> ${r.rating} (${r.reviewCount.toLocaleString()} reviews)</span>
          <span><i class="fa-solid fa-clock"></i> ${r.deliveryTime}</span>
          <span><i class="fa-solid fa-truck"></i> $${r.deliveryFee.toFixed(2)} delivery</span>
          <span><i class="fa-solid fa-receipt"></i> $${r.minOrder.toFixed(2)} min. order</span>
        </div>
      </div>
    </div>`;
}

/* ---------- Populate Category Dropdown ---------- */
function populateCategoryOptions() {
  const select = document.getElementById("categoryFilter");
  const categorySet = new Set(currentRestaurantItems.map((f) => f.category));

  [...categorySet].sort().forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

/* ---------- Mobile Filter Panel Toggle ---------- */
function setupFilterToggle() {
  const toggleBtn = document.getElementById("filterToggleBtn");
  const panel = document.getElementById("filterPanel");

  toggleBtn.addEventListener("click", () => {
    const isOpen = panel.classList.toggle("open");
    toggleBtn.setAttribute("aria-expanded", String(isOpen));
  });
}

/* ---------- Wire Up Filter Inputs ---------- */
function setupMenuFilterListeners() {
  document.getElementById("menuSearch").addEventListener("input", applyMenuFiltersAndRender);
  document.getElementById("categoryFilter").addEventListener("change", applyMenuFiltersAndRender);
  document.getElementById("menuSortSelect").addEventListener("change", applyMenuFiltersAndRender);

  document.querySelectorAll(".dietary-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", applyMenuFiltersAndRender);
  });
}

function setupClearFilters() {
  document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    document.getElementById("menuSearch").value = "";
    document.getElementById("categoryFilter").value = "all";
    document.getElementById("menuSortSelect").value = "default";
    document.querySelectorAll(".dietary-checkbox").forEach((c) => (c.checked = false));
    applyMenuFiltersAndRender();
  });
}

/* ---------- Filtering + Sorting ---------- */
function applyMenuFiltersAndRender() {
  const search = document.getElementById("menuSearch").value.trim().toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const sortBy = document.getElementById("menuSortSelect").value;
  const activeDietary = [...document.querySelectorAll(".dietary-checkbox:checked")].map((c) => c.value);

  let results = currentRestaurantItems.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(search);
    const matchesCategory = category === "all" || food.category === category;
    const matchesDietary = activeDietary.length === 0 || activeDietary.includes(food.dietaryType);

    return matchesSearch && matchesCategory && matchesDietary;
  });

  if (sortBy === "price-asc") {
    results = results.slice().sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    results = results.slice().sort((a, b) => b.price - a.price);
  } else if (sortBy === "rating-desc") {
    results = results.slice().sort((a, b) => b.rating - a.rating);
  }

  renderMenuResults(results);
}

/* ---------- Render Food Results ---------- */
function renderMenuResults(results) {
  const grid = document.getElementById("foodGrid");
  const resultsCount = document.getElementById("resultsCount");

  resultsCount.textContent = `${results.length} item${results.length === 1 ? "" : "s"} found`;

  if (!results.length) {
    grid.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-utensils"></i>
        <h3>No dishes match your filters</h3>
        <p>Try a different search term or clear your filters.</p>
      </div>`;
    return;
  }

  grid.innerHTML = results
    .map((food) => {
      const isWishlisted = isInWishlist(food.id);
      return `
      <article class="food-card">
        <div class="food-img-wrap">
          <img src="${food.image}" alt="${food.name}" loading="lazy" />
          <span class="dietary-tag">${food.dietaryType}</span>
          <button class="wishlist-btn ${isWishlisted ? "active" : ""}" data-id="${food.id}" aria-label="Add to wishlist" type="button">
            <i class="fa-${isWishlisted ? "solid" : "regular"} fa-heart"></i>
          </button>
          ${!food.available ? '<span class="unavailable-overlay">Currently Unavailable</span>' : ""}
        </div>
        <div class="food-body">
          <h3>${food.name}</h3>
          <p class="food-desc">${food.description}</p>
          <p class="food-rating"><i class="fa-solid fa-star"></i> ${food.rating}</p>
          <div class="food-footer">
            <span class="food-price">$${food.price.toFixed(2)}</span>
            <button class="add-cart-btn" data-id="${food.id}" data-name="${food.name}" type="button" ${food.available ? "" : "disabled"}>
              <i class="fa-solid fa-plus"></i> ${food.available ? "Add" : "Sold Out"}
            </button>
          </div>
        </div>
      </article>`;
    })
    .join("");

  setupMenuAddToCart();
  attachWishlistButtons(grid);
}

/* ---------- Add to Cart ---------- */
function setupMenuAddToCart() {
  document.querySelectorAll(".add-cart-btn").forEach((btn) => {
    if (btn.disabled) return;
    btn.addEventListener("click", () => {
      requestAddToCart(Number(btn.dataset.id));
    });
  });
}
