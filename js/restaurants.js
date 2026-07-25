/* ===========================================================
   FreshBite - Restaurants Listing Page
   Renders restaurants dynamically with search, filters, and sort.
   =========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  populateCuisineOptions();
  prefillSearchFromUrl();
  renderSkeletonCards("restaurantGrid", 6);

  // Short simulated delay so the skeleton loading state is visible - this
  // is a demo of a loading state, not a real network request.
  setTimeout(() => {
    applyFiltersAndRender();
  }, 350);

  setupFilterToggle();
  setupFilterListeners();
  setupClearFilters();
});

/* ---------- Skeleton Loading State ---------- */
function renderSkeletonCards(containerId, count) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = Array.from({ length: count })
    .map(
      () => `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton-block skeleton-image"></div>
        <div class="skeleton-block skeleton-line skeleton-line-title"></div>
        <div class="skeleton-block skeleton-line skeleton-line-short"></div>
        <div class="skeleton-block skeleton-line skeleton-line-short"></div>
      </div>`
    )
    .join("");
}

// Supports links like restaurants.html?search=pizza (used by 404.html and
// the global search "no exact match" fallback).
function prefillSearchFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const search = params.get("search");
  if (search) {
    document.getElementById("restaurantSearch").value = search;
  }
}

/* ---------- Populate Cuisine Dropdown ---------- */
function populateCuisineOptions() {
  const select = document.getElementById("cuisineFilter");
  const cuisineSet = new Set();

  restaurants.forEach((r) => {
    r.cuisine.split(",").forEach((c) => cuisineSet.add(c.trim()));
  });

  [...cuisineSet]
    .sort()
    .forEach((cuisine) => {
      const option = document.createElement("option");
      option.value = cuisine;
      option.textContent = cuisine;
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
function setupFilterListeners() {
  const ids = [
    "restaurantSearch",
    "cuisineFilter",
    "ratingFilter",
    "priceFilter",
    "deliveryTimeFilter",
    "freeDeliveryFilter",
    "openNowFilter",
    "sortSelect",
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    const eventType = el.tagName === "INPUT" && el.type === "text" ? "input" : "change";
    el.addEventListener(eventType, applyFiltersAndRender);
  });
}

function setupClearFilters() {
  document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    document.getElementById("restaurantSearch").value = "";
    document.getElementById("cuisineFilter").value = "all";
    document.getElementById("ratingFilter").value = "0";
    document.getElementById("priceFilter").value = "0";
    document.getElementById("deliveryTimeFilter").value = "0";
    document.getElementById("freeDeliveryFilter").checked = false;
    document.getElementById("openNowFilter").checked = false;
    document.getElementById("sortSelect").value = "default";
    applyFiltersAndRender();
  });
}

/* ---------- Filtering + Sorting ---------- */
function applyFiltersAndRender() {
  const search = document.getElementById("restaurantSearch").value.trim().toLowerCase();
  const cuisine = document.getElementById("cuisineFilter").value;
  const minRating = parseFloat(document.getElementById("ratingFilter").value);
  const priceLevel = parseInt(document.getElementById("priceFilter").value, 10);
  const maxDeliveryTime = parseInt(document.getElementById("deliveryTimeFilter").value, 10);
  const freeDeliveryOnly = document.getElementById("freeDeliveryFilter").checked;
  const openOnly = document.getElementById("openNowFilter").checked;
  const sortBy = document.getElementById("sortSelect").value;

  let results = restaurants.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search);
    const matchesCuisine = cuisine === "all" || r.cuisine.toLowerCase().includes(cuisine.toLowerCase());
    const matchesRating = r.rating >= minRating;
    const matchesPrice = priceLevel === 0 || r.priceLevel === priceLevel;
    const matchesDeliveryTime = maxDeliveryTime === 0 || r.deliveryTimeMin <= maxDeliveryTime;
    const matchesFreeDelivery = !freeDeliveryOnly || r.deliveryFee === 0;
    const matchesOpen = !openOnly || r.isOpen;

    return (
      matchesSearch &&
      matchesCuisine &&
      matchesRating &&
      matchesPrice &&
      matchesDeliveryTime &&
      matchesFreeDelivery &&
      matchesOpen
    );
  });

  if (sortBy === "rating-desc") {
    results = results.slice().sort((a, b) => b.rating - a.rating);
  } else if (sortBy === "delivery-asc") {
    results = results.slice().sort((a, b) => a.deliveryTimeMin - b.deliveryTimeMin);
  } else if (sortBy === "fee-asc") {
    results = results.slice().sort((a, b) => a.deliveryFee - b.deliveryFee);
  }

  renderRestaurantResults(results);
}

/* ---------- Render Results ---------- */
function renderRestaurantResults(results) {
  const grid = document.getElementById("restaurantGrid");
  const resultsCount = document.getElementById("resultsCount");

  resultsCount.textContent = `${results.length} restaurant${results.length === 1 ? "" : "s"} found`;

  if (!results.length) {
    grid.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-shop-slash"></i>
        <h3>No restaurants match your filters</h3>
        <p>Try adjusting or clearing your filters to see more results.</p>
      </div>`;
    return;
  }

  grid.innerHTML = results
    .map((r) => {
      const priceSymbols = "$".repeat(r.priceLevel);
      return `
      <article class="restaurant-card">
        <div class="restaurant-img-wrap">
          <img src="${r.image}" alt="${r.name}" loading="lazy" />
          <span class="restaurant-rating"><i class="fa-solid fa-star"></i> ${r.rating}</span>
          <span class="status-badge ${r.isOpen ? "status-open" : "status-closed"}">
            ${r.isOpen ? "Open" : "Closed"}
          </span>
        </div>
        <div class="restaurant-body">
          <h3>${r.name}</h3>
          <p class="restaurant-cuisine">${r.cuisine}</p>
          <p class="restaurant-reviews">${r.reviewCount.toLocaleString()} reviews &bull; ${priceSymbols}</p>
          <div class="restaurant-meta">
            <span><i class="fa-solid fa-clock"></i> ${r.deliveryTime}</span>
            <span><i class="fa-solid fa-truck"></i> $${r.deliveryFee.toFixed(2)} fee</span>
          </div>
          <div class="dietary-options">
            ${r.dietaryOptions.map((tag) => `<span class="dietary-chip">${tag}</span>`).join("")}
          </div>
          <a class="btn btn-primary btn-small view-menu-btn" href="menu.html?restaurantId=${r.id}">
            View Menu
          </a>
        </div>
      </article>`;
    })
    .join("");
}
