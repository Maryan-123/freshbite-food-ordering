/* ===========================================================
   FreshBite - Global Search
   Injects a search icon into the navbar on every page. Opens a
   dropdown panel that live-searches restaurants, food items,
   categories/cuisines, and offers, with full keyboard navigation.
   =========================================================== */

const SEARCH_DEBOUNCE_MS = 200;
let searchDebounceTimer = null;
let activeResultIndex = -1;
let currentResults = [];

document.addEventListener("DOMContentLoaded", () => {
  injectGlobalSearch();
});

/* ---------- Inject Search UI ---------- */
function injectGlobalSearch() {
  if (document.getElementById("globalSearchBtn")) return;

  const navActions = document.querySelector(".nav-actions");
  if (!navActions) return;

  const wrapper = document.createElement("div");
  wrapper.className = "global-search";
  wrapper.innerHTML = `
    <button type="button" class="icon-btn" id="globalSearchBtn" aria-label="Search FreshBite" aria-expanded="false">
      <i class="fa-solid fa-magnifying-glass"></i>
    </button>
    <div class="global-search-panel" id="globalSearchPanel" hidden>
      <div class="global-search-field">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" id="globalSearchInput" placeholder="Search restaurants, dishes, offers..." aria-label="Global search" autocomplete="off" />
        <button type="button" class="global-search-close" id="globalSearchClose" aria-label="Close search">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="global-search-results" id="globalSearchResults" role="listbox"></div>
    </div>`;

  const cartBtn = navActions.querySelector(".cart-btn");
  if (cartBtn) {
    navActions.insertBefore(wrapper, cartBtn);
  } else {
    navActions.insertBefore(wrapper, navActions.firstChild);
  }

  setupGlobalSearchEvents();
}

function setupGlobalSearchEvents() {
  const toggleBtn = document.getElementById("globalSearchBtn");
  const panel = document.getElementById("globalSearchPanel");
  const input = document.getElementById("globalSearchInput");
  const closeBtn = document.getElementById("globalSearchClose");

  toggleBtn.addEventListener("click", () => {
    const isOpen = !panel.hidden;
    if (isOpen) {
      closeGlobalSearch();
    } else {
      openGlobalSearch();
    }
  });

  closeBtn.addEventListener("click", closeGlobalSearch);

  document.addEventListener("click", (e) => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
      closeGlobalSearch();
    }
  });

  input.addEventListener("input", () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => runGlobalSearch(input.value), SEARCH_DEBOUNCE_MS);
  });

  input.addEventListener("keydown", handleSearchKeydown);
}

function openGlobalSearch() {
  const panel = document.getElementById("globalSearchPanel");
  const toggleBtn = document.getElementById("globalSearchBtn");
  panel.hidden = false;
  toggleBtn.setAttribute("aria-expanded", "true");
  document.getElementById("globalSearchInput").focus();
}

function closeGlobalSearch() {
  const panel = document.getElementById("globalSearchPanel");
  const toggleBtn = document.getElementById("globalSearchBtn");
  panel.hidden = true;
  toggleBtn.setAttribute("aria-expanded", "false");
  activeResultIndex = -1;
}

/* ---------- Search Logic ---------- */
function runGlobalSearch(rawQuery) {
  const query = rawQuery.trim().toLowerCase();
  const resultsContainer = document.getElementById("globalSearchResults");
  activeResultIndex = -1;

  if (!query) {
    resultsContainer.innerHTML = `<p class="search-hint">Start typing to search restaurants, dishes, categories, cuisines, and offers.</p>`;
    currentResults = [];
    return;
  }

  const results = [];

  restaurants
    .filter((r) => r.name.toLowerCase().includes(query) || r.cuisine.toLowerCase().includes(query))
    .slice(0, 4)
    .forEach((r) =>
      results.push({
        type: "Restaurant",
        icon: "fa-solid fa-store",
        image: r.image,
        title: r.name,
        subtitle: r.cuisine,
        url: `menu.html?restaurantId=${r.id}`,
      })
    );

  foodItems
    .filter((f) => f.name.toLowerCase().includes(query) || f.category.toLowerCase().includes(query))
    .slice(0, 5)
    .forEach((f) =>
      results.push({
        type: "Dish",
        icon: "fa-solid fa-utensils",
        image: f.image,
        title: f.name,
        subtitle: `$${f.price.toFixed(2)}`,
        url: `product.html?foodId=${f.id}`,
      })
    );

  const categoryMatches = categories.filter((c) => c.name.toLowerCase().includes(query)).slice(0, 3);
  categoryMatches.forEach((c) =>
    results.push({
      type: "Category",
      icon: c.icon,
      image: null,
      title: c.name,
      subtitle: `${c.itemCount} items`,
      url: `menu.html`,
    })
  );

  const cuisineSet = new Set(restaurants.map((r) => r.cuisine.split(",")[0].trim()));
  [...cuisineSet]
    .filter((c) => c.toLowerCase().includes(query))
    .slice(0, 3)
    .forEach((cuisine) =>
      results.push({
        type: "Cuisine",
        icon: "fa-solid fa-globe",
        image: null,
        title: cuisine,
        subtitle: "Cuisine",
        url: `restaurants.html`,
      })
    );

  if (typeof specialOffers !== "undefined") {
    specialOffers
      .filter((o) => o.title.toLowerCase().includes(query) || o.code.toLowerCase().includes(query))
      .slice(0, 3)
      .forEach((o) =>
        results.push({
          type: "Offer",
          icon: "fa-solid fa-tag",
          image: null,
          title: o.title,
          subtitle: o.code,
          url: `offers.html`,
        })
      );
  }

  currentResults = results;
  renderSearchResults(results, query);
}

function renderSearchResults(results, query) {
  const container = document.getElementById("globalSearchResults");

  if (!results.length) {
    container.innerHTML = `
      <div class="search-empty">
        <i class="fa-solid fa-magnifying-glass"></i>
        <p>No results found for "${query}"</p>
      </div>`;
    return;
  }

  container.innerHTML = results
    .map(
      (result, index) => `
      <a href="${result.url}" class="search-result-item" data-index="${index}" role="option">
        <span class="search-result-icon">
          ${result.image ? `<img src="${result.image}" alt="" loading="lazy" />` : `<i class="${result.icon}"></i>`}
        </span>
        <span class="search-result-text">
          <span class="search-result-title">${result.title}</span>
          <span class="search-result-subtitle">${result.subtitle}</span>
        </span>
        <span class="search-result-type">${result.type}</span>
      </a>`
    )
    .join("");
}

/* ---------- Keyboard Navigation ---------- */
function handleSearchKeydown(e) {
  const items = document.querySelectorAll(".search-result-item");
  if (!items.length) {
    if (e.key === "Escape") closeGlobalSearch();
    return;
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeResultIndex = Math.min(activeResultIndex + 1, items.length - 1);
    highlightActiveResult(items);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeResultIndex = Math.max(activeResultIndex - 1, 0);
    highlightActiveResult(items);
  } else if (e.key === "Enter") {
    e.preventDefault();
    const target = activeResultIndex >= 0 ? items[activeResultIndex] : items[0];
    if (target) window.location.href = target.getAttribute("href");
  } else if (e.key === "Escape") {
    closeGlobalSearch();
  }
}

function highlightActiveResult(items) {
  items.forEach((item, index) => item.classList.toggle("active", index === activeResultIndex));
  if (items[activeResultIndex]) {
    items[activeResultIndex].scrollIntoView({ block: "nearest" });
  }
}
