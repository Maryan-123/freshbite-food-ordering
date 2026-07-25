/* ===========================================================
   FreshBite - Main Script
   Renders dynamic content and handles UI interactions.
   =========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  renderRestaurants();
  renderFoodItems(foodItems);
  renderOffers();
  setupMobileMenu();
  setupHeroSearch();
  setupMenuFilters();
  setupAddToCart();
  setupNewsletter();
  setCurrentYear();
});

/* ---------- Render: Categories ---------- */
function renderCategories() {
  const grid = document.getElementById("categoryGrid");
  grid.innerHTML = categories
    .map(
      (cat) => `
      <button class="category-card" data-category="${cat.name}" type="button">
        <span class="category-icon"><i class="${cat.icon}"></i></span>
        <h3>${cat.name}</h3>
        <span>${cat.itemCount} items</span>
      </button>`
    )
    .join("");

  // Clicking a category filters the popular dishes section
  grid.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", () => {
      const category = card.dataset.category;
      filterFoodByCategory(category);
      document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
    });
  });
}

/* ---------- Render: Restaurants ---------- */
function renderRestaurants() {
  const grid = document.getElementById("restaurantGrid");
  grid.innerHTML = restaurants
    .map(
      (r) => `
      <article class="restaurant-card">
        <div class="restaurant-img-wrap">
          <img src="${r.image}" alt="${r.name}" loading="lazy" />
          <span class="restaurant-rating"><i class="fa-solid fa-star"></i> ${r.rating}</span>
        </div>
        <div class="restaurant-body">
          <h3>${r.name}</h3>
          <p class="restaurant-cuisine">${r.cuisine}</p>
          <div class="restaurant-meta">
            <span><i class="fa-solid fa-clock"></i> ${r.deliveryTime}</span>
            <span><i class="fa-solid fa-truck"></i> $${r.deliveryFee.toFixed(2)} fee</span>
          </div>
          <a class="btn btn-primary btn-small view-menu-btn" href="menu.html?restaurantId=${r.id}">
            View Menu
          </a>
        </div>
      </article>`
    )
    .join("");
}

/* ---------- Render: Food Items ---------- */
function renderFoodItems(items) {
  const grid = document.getElementById("foodGrid");

  if (!items.length) {
    grid.innerHTML = `<p class="no-results">No dishes found. Try a different search or category.</p>`;
    return;
  }

  grid.innerHTML = items
    .map((food) => {
      const isWishlisted = typeof isInWishlist === "function" && isInWishlist(food.id);
      return `
      <article class="food-card">
        <div class="food-img-wrap">
          <img src="${food.image}" alt="${food.name}" loading="lazy" />
          <span class="dietary-tag">${food.dietaryType}</span>
          <button class="wishlist-btn ${isWishlisted ? "active" : ""}" data-id="${food.id}" aria-label="Add to wishlist" type="button">
            <i class="fa-${isWishlisted ? "solid" : "regular"} fa-heart"></i>
          </button>
        </div>
        <div class="food-body">
          <h3>${food.name}</h3>
          <p class="food-desc">${food.description}</p>
          <p class="food-rating"><i class="fa-solid fa-star"></i> ${food.rating}</p>
          <div class="food-footer">
            <span class="food-price">$${food.price.toFixed(2)}</span>
            <button class="add-cart-btn" data-id="${food.id}" data-name="${food.name}" type="button">
              <i class="fa-solid fa-plus"></i> Add
            </button>
          </div>
        </div>
      </article>`;
    })
    .join("");

  setupAddToCart();
  if (typeof attachWishlistButtons === "function") attachWishlistButtons(grid);
}

/* ---------- Render: Special Offers ---------- */
function renderOffers() {
  const grid = document.getElementById("offersGrid");
  grid.innerHTML = specialOffers
    .map(
      (offer) => `
      <article class="offer-card">
        <span class="offer-icon"><i class="${offer.icon}"></i></span>
        <h3>${offer.title}</h3>
        <p>${offer.description}</p>
        <div class="offer-meta">
          <span class="offer-code">${offer.code}</span>
          <span class="offer-expiry"><i class="fa-regular fa-clock"></i> Expires ${formatDate(offer.expiry)}</span>
        </div>
      </article>`
    )
    .join("");
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ---------- Mobile Hamburger Menu ---------- */
function setupMobileMenu() {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");

  hamburger.addEventListener("click", () => {
    const isActive = navLinks.classList.toggle("active");
    hamburger.classList.toggle("active", isActive);
    hamburger.setAttribute("aria-expanded", String(isActive));
  });

  // Close menu when a link is clicked (mobile)
  navLinks.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
      hamburger.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");

      navLinks.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
  });
}

/* ---------- Hero Search ---------- */
function setupHeroSearch() {
  const form = document.getElementById("heroSearchForm");
  const foodSearchInput = document.getElementById("foodSearchInput");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = foodSearchInput.value.trim().toLowerCase();

    if (!query) {
      showToast("Please enter a dish or restaurant to search.", "fa-solid fa-circle-info");
      document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
      return;
    }

    const results = foodItems.filter(
      (food) =>
        food.name.toLowerCase().includes(query) ||
        food.category.toLowerCase().includes(query) ||
        food.description.toLowerCase().includes(query)
    );

    renderFoodItems(results);
    resetFilterButtons();
    document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
  });
}

/* ---------- Menu Category Filters ---------- */
function setupMenuFilters() {
  const buttons = document.querySelectorAll(".filter-btn");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      resetFilterButtons();
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      const items = filter === "all" ? foodItems : foodItems.filter((f) => f.category === filter);
      renderFoodItems(items);
    });
  });
}

function filterFoodByCategory(category) {
  resetFilterButtons();
  const matchingBtn = document.querySelector(`.filter-btn[data-filter="${category}"]`);
  if (matchingBtn) matchingBtn.classList.add("active");

  const items = foodItems.filter((f) => f.category === category);
  renderFoodItems(items.length ? items : foodItems);
}

function resetFilterButtons() {
  document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
  if (allBtn) allBtn.classList.add("active");
}

/* ---------- Add to Cart ---------- */
function setupAddToCart() {
  document.querySelectorAll(".add-cart-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      requestAddToCart(Number(btn.dataset.id));
    });
  });
}

/* ---------- Newsletter Validation ---------- */
function setupNewsletter() {
  const form = document.getElementById("newsletterForm");
  const emailInput = document.getElementById("newsletterEmail");
  const message = document.getElementById("newsletterMessage");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    message.classList.remove("success", "error");

    if (!email || !emailPattern.test(email)) {
      message.textContent = "Please enter a valid email address.";
      message.classList.add("error");
      return;
    }

    message.textContent = "Thanks for subscribing! Check your inbox soon.";
    message.classList.add("success");
    form.reset();
  });
}

/* ---------- Toast Notification ---------- */
let toastTimeout;

function showToast(text, iconClass = "fa-solid fa-circle-check") {
  const toast = document.getElementById("toast");
  toast.innerHTML = `<i class="${iconClass}"></i> ${text}`;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

/* ---------- Footer Year ---------- */
function setCurrentYear() {
  document.getElementById("currentYear").textContent = new Date().getFullYear();
}
