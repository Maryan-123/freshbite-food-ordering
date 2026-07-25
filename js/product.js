/* ===========================================================
   FreshBite - Product Detail Page
   Reads foodId from the URL, renders full details, customization,
   related dishes, reviews (with sorting + helpful votes), and
   manages "recently viewed" + a simple "recommended for you" feed.
   =========================================================== */

const RECENTLY_VIEWED_KEY = "freshbite_recently_viewed";
const FOOD_REVIEWS_KEY = "freshbite_food_reviews";
const HELPFUL_VOTES_KEY = "freshbite_review_helpful";
const MAX_RECENTLY_VIEWED = 8;

let currentProduct = null;
let productCustomization = { size: "Medium", spice: "Medium", extras: [], instructions: "" };
let currentReviewSort = "recent";

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("productDetail")) {
    initProductPage();
  }

  // These two feeds can also render on the home page if the containers exist.
  renderRecentlyViewedSection();
  renderRecommendedSection();
});

/* ---------- Init ---------- */
function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const foodId = Number(params.get("foodId"));
  currentProduct = foodItems.find((f) => f.id === foodId);

  if (!currentProduct) {
    renderInvalidProduct();
    return;
  }

  addToRecentlyViewed(foodId);
  renderProductDetail(currentProduct);
  setupCustomizationControls(currentProduct);
  setupProductActions(currentProduct);
  renderRelatedSections(currentProduct);
  renderProductReviews(currentProduct.id);
  setupReviewSortControls(currentProduct.id);
}

function renderInvalidProduct() {
  document.getElementById("productDetail").innerHTML = `
    <div class="no-results">
      <i class="fa-solid fa-bowl-food"></i>
      <h3>Dish not found</h3>
      <p>The food item you're looking for doesn't exist or the link is invalid.</p>
      <a href="restaurants.html" class="btn btn-primary">Browse Restaurants</a>
    </div>`;
  document.querySelectorAll(".product-below-fold").forEach((el) => (el.hidden = true));
}

/* ---------- Synthesized Detail Data ---------- */
// The core data model doesn't include every merchandising field (prep time,
// calories, ingredients...), so realistic-but-simulated details are derived
// deterministically from the food's id/category. Clearly a simulation, not
// real nutritional data.
const INGREDIENT_POOL = {
  Pizza: ["Wheat flour dough", "Tomato sauce", "Mozzarella cheese", "Olive oil", "Fresh basil"],
  Burgers: ["Beef or plant-based patty", "Brioche bun", "Lettuce", "Tomato", "House sauce"],
  "Somali Food": ["Basmati rice", "Beef or goat meat", "Onions", "Somali spice blend", "Fresh coriander"],
  Chicken: ["Chicken", "Signature spice rub", "Garlic", "Lemon", "Fresh herbs"],
  Desserts: ["Flour", "Sugar", "Butter", "Eggs", "Vanilla extract"],
  Drinks: ["Fresh fruit", "Ice", "Natural sweetener", "Filtered water"],
  Pasta: ["Durum wheat pasta", "Olive oil", "Garlic", "Parmesan cheese", "Fresh herbs"],
};

const ALLERGEN_POOL = {
  Pizza: ["Gluten", "Dairy"],
  Burgers: ["Gluten", "Dairy", "Sesame"],
  "Somali Food": ["May contain nuts"],
  Chicken: ["May contain soy"],
  Desserts: ["Gluten", "Dairy", "Eggs"],
  Drinks: ["May contain traces of nuts"],
  Pasta: ["Gluten", "Dairy", "Eggs"],
};

function getSynthesizedDetails(food) {
  const previousPrice = food.id % 3 === 0 ? +(food.price * 1.2).toFixed(2) : null;
  const prepTimeBase = 10 + (food.id % 5) * 5;
  const calories = 250 + ((food.id * 37) % 500);

  return {
    previousPrice,
    prepTime: `${prepTimeBase}-${prepTimeBase + 10} min`,
    calories,
    ingredients: INGREDIENT_POOL[food.category] || INGREDIENT_POOL.Chicken,
    allergens: ALLERGEN_POOL[food.category] || ["Check with restaurant"],
  };
}

/* ---------- Render: Product Detail ---------- */
function renderProductDetail(food) {
  const restaurant = restaurants.find((r) => r.id === food.restaurantId);
  const details = getSynthesizedDetails(food);
  const isWishlisted = isInWishlist(food.id);

  document.title = `${food.name} | FreshBite`;

  document.getElementById("productDetail").innerHTML = `
    <div class="product-gallery">
      <img src="${food.image}" alt="${food.name}" class="product-main-image" loading="lazy" />
      ${!food.available ? '<span class="unavailable-overlay product-unavailable">Currently Unavailable</span>' : ""}
    </div>

    <div class="product-info">
      <p class="product-restaurant-link">
        <i class="fa-solid fa-store"></i>
        ${restaurant ? `<a href="menu.html?restaurantId=${restaurant.id}">${restaurant.name}</a>` : "FreshBite Restaurant"}
      </p>

      <h1>${food.name}</h1>

      <div class="product-meta-row">
        <span class="product-rating"><i class="fa-solid fa-star"></i> ${food.rating} <span id="productReviewCount"></span></span>
        <span class="dietary-chip">${food.dietaryType}</span>
        <span class="status-badge ${food.available ? "status-open" : "status-closed"}">${food.available ? "Available" : "Sold Out"}</span>
      </div>

      <p class="product-description">${food.description} This dish is freshly prepared to order using quality ingredients sourced by the restaurant.</p>

      <div class="product-price-row">
        <span class="product-price" id="productUnitPrice">$${food.price.toFixed(2)}</span>
        ${details.previousPrice ? `<span class="product-old-price">$${details.previousPrice.toFixed(2)}</span><span class="product-discount-tag">Save $${(details.previousPrice - food.price).toFixed(2)}</span>` : ""}
      </div>

      <div class="product-facts">
        <span><i class="fa-solid fa-clock"></i> ${details.prepTime}</span>
        <span><i class="fa-solid fa-fire"></i> ~${details.calories} kcal</span>
      </div>

      <!-- Customization -->
      <div class="customization-panel" id="customizationPanel">
        <h3>Customize Your Order</h3>

        <div class="customization-group">
          <label>Size</label>
          <div class="option-row" id="sizeOptions">
            <label class="option-card"><input type="radio" name="size" value="Small" /> <span>Small</span></label>
            <label class="option-card"><input type="radio" name="size" value="Medium" checked /> <span>Medium (+$1.00)</span></label>
            <label class="option-card"><input type="radio" name="size" value="Large" /> <span>Large (+$2.50)</span></label>
          </div>
        </div>

        <div class="customization-group">
          <label>Spice Level</label>
          <div class="option-row" id="spiceOptions">
            <label class="option-card"><input type="radio" name="spice" value="Mild" /> <span>Mild</span></label>
            <label class="option-card"><input type="radio" name="spice" value="Medium" checked /> <span>Medium</span></label>
            <label class="option-card"><input type="radio" name="spice" value="Hot" /> <span>Hot</span></label>
          </div>
        </div>

        <div class="customization-group">
          <label>Extras</label>
          <div class="extras-grid" id="extrasOptions">
            <label class="checkbox-label"><input type="checkbox" value="Extra Cheese" data-price="1.00" /> Extra Cheese (+$1.00)</label>
            <label class="checkbox-label"><input type="checkbox" value="Extra Sauce" data-price="0.50" /> Extra Sauce (+$0.50)</label>
            <label class="checkbox-label"><input type="checkbox" value="Extra Toppings" data-price="1.50" /> Extra Toppings (+$1.50)</label>
          </div>
        </div>

        <div class="customization-group">
          <label for="specialInstructions">Special Instructions</label>
          <textarea id="specialInstructions" rows="2" placeholder="e.g. No onions, please"></textarea>
        </div>
      </div>

      <div class="product-actions">
        <div class="qty-controls product-qty-controls">
          <button class="qty-btn" id="productQtyMinus" type="button" aria-label="Decrease quantity"><i class="fa-solid fa-minus"></i></button>
          <span class="qty-value" id="productQtyValue">1</span>
          <button class="qty-btn" id="productQtyPlus" type="button" aria-label="Increase quantity"><i class="fa-solid fa-plus"></i></button>
        </div>

        <button class="btn btn-primary product-add-btn" id="productAddToCartBtn" type="button" ${food.available ? "" : "disabled"}>
          <i class="fa-solid fa-cart-plus"></i> Add to Cart - <span id="productTotalPrice">$${food.price.toFixed(2)}</span>
        </button>

        <button class="wishlist-btn product-wishlist-btn ${isWishlisted ? "active" : ""}" data-id="${food.id}" aria-label="Add to wishlist" type="button">
          <i class="fa-${isWishlisted ? "solid" : "regular"} fa-heart"></i>
        </button>

        <button class="icon-btn" id="productShareBtn" aria-label="Share this dish" type="button">
          <i class="fa-solid fa-share-nodes"></i>
        </button>
      </div>

      <div class="product-extra-info">
        <div>
          <h4>Ingredients</h4>
          <p>${details.ingredients.join(", ")}</p>
        </div>
        <div>
          <h4>Allergens</h4>
          <p>${details.allergens.join(", ")}</p>
        </div>
      </div>
    </div>`;

  attachWishlistButtons(document.getElementById("productDetail"));
}

/* ---------- Customization + Live Price ---------- */
function setupCustomizationControls(food) {
  const sizePrices = { Small: 0, Medium: 1.0, Large: 2.5 };

  function recalcPrice() {
    const size = document.querySelector('input[name="size"]:checked').value;
    const spice = document.querySelector('input[name="spice"]:checked').value;
    const extraCheckboxes = [...document.querySelectorAll('#extrasOptions input:checked')];
    const extras = extraCheckboxes.map((cb) => cb.value);
    const extrasTotal = extraCheckboxes.reduce((sum, cb) => sum + Number(cb.dataset.price), 0);
    const quantity = Number(document.getElementById("productQtyValue").textContent);

    const unitPrice = +(food.price + sizePrices[size] + extrasTotal).toFixed(2);
    const total = +(unitPrice * quantity).toFixed(2);

    productCustomization = {
      size,
      spice,
      extras,
      instructions: document.getElementById("specialInstructions").value.trim(),
    };

    document.getElementById("productUnitPrice").textContent = `$${unitPrice.toFixed(2)}`;
    document.getElementById("productTotalPrice").textContent = `$${total.toFixed(2)}`;

    return unitPrice;
  }

  document.querySelectorAll('#sizeOptions input, #spiceOptions input, #extrasOptions input').forEach((input) => {
    input.addEventListener("change", recalcPrice);
  });
  document.getElementById("specialInstructions").addEventListener("input", recalcPrice);

  document.getElementById("productQtyMinus").addEventListener("click", () => {
    const qtyEl = document.getElementById("productQtyValue");
    const qty = Math.max(1, Number(qtyEl.textContent) - 1);
    qtyEl.textContent = qty;
    recalcPrice();
  });

  document.getElementById("productQtyPlus").addEventListener("click", () => {
    const qtyEl = document.getElementById("productQtyValue");
    qtyEl.textContent = Number(qtyEl.textContent) + 1;
    recalcPrice();
  });

  recalcPrice();
}

/* ---------- Add to Cart / Share ---------- */
function setupProductActions(food) {
  document.getElementById("productAddToCartBtn").addEventListener("click", () => {
    const quantity = Number(document.getElementById("productQtyValue").textContent);
    const sizePrices = { Small: 0, Medium: 1.0, Large: 2.5 };
    const extrasTotal = productCustomization.extras.reduce((sum, extraName) => {
      const map = { "Extra Cheese": 1.0, "Extra Sauce": 0.5, "Extra Toppings": 1.5 };
      return sum + (map[extraName] || 0);
    }, 0);
    const unitPrice = +(food.price + sizePrices[productCustomization.size] + extrasTotal).toFixed(2);

    const line = {
      foodId: food.id,
      restaurantId: food.restaurantId,
      name: food.name,
      image: food.image,
      unitPrice,
      quantity,
      dietaryType: food.dietaryType,
      size: productCustomization.size,
      extras: productCustomization.extras,
      instructions: productCustomization.instructions,
    };

    requestAddCustomLineToCart(line);
  });

  document.getElementById("productShareBtn").addEventListener("click", async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: food.name, text: `Check out ${food.name} on FreshBite!`, url: shareUrl });
      } catch (err) {
        // User cancelled the native share sheet - nothing to do.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Product link copied to clipboard!", "success");
    } catch (err) {
      showToast("Could not copy the link automatically. Copy it from the address bar.", "warning");
    }
  });
}

/* ---------- Related Sections ---------- */
function renderRelatedSections(food) {
  renderFoodCardRow(
    "similarDishesGrid",
    foodItems.filter((f) => f.id !== food.id && f.category === food.category).slice(0, 4)
  );

  renderFoodCardRow(
    "moreFromRestaurantGrid",
    foodItems.filter((f) => f.id !== food.id && f.restaurantId === food.restaurantId).slice(0, 4)
  );

  // "Frequently ordered together" - deterministic pick from the same restaurant,
  // simulating a pairing suggestion rather than real order-history analysis.
  const pairSuggestions = foodItems
    .filter((f) => f.id !== food.id && f.restaurantId === food.restaurantId)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
  renderFoodCardRow("frequentlyTogetherGrid", pairSuggestions);
}

function renderFoodCardRow(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const section = container.closest(".related-section");

  if (!items.length) {
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;

  container.innerHTML = items
    .map((food) => {
      const isWishlisted = isInWishlist(food.id);
      return `
      <article class="food-card">
        <a href="product.html?foodId=${food.id}" class="food-img-wrap">
          <img src="${food.image}" alt="${food.name}" loading="lazy" />
          <span class="dietary-tag">${food.dietaryType}</span>
          <button class="wishlist-btn ${isWishlisted ? "active" : ""}" data-id="${food.id}" aria-label="Add to wishlist" type="button">
            <i class="fa-${isWishlisted ? "solid" : "regular"} fa-heart"></i>
          </button>
        </a>
        <div class="food-body">
          <h3><a href="product.html?foodId=${food.id}">${food.name}</a></h3>
          <p class="food-desc">${getRestaurantName(food.restaurantId)}</p>
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

  container.querySelectorAll(".add-cart-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      requestAddToCart(Number(btn.dataset.id));
    });
  });

  attachWishlistButtons(container);
}

/* ===========================================================
   Product Reviews (per food item - separate from restaurant/order
   reviews in reviews.js, since a food-level review isn't tied to
   one specific order the way a restaurant review is).
   =========================================================== */
function getFoodReviews(foodId) {
  const all = readStorage(FOOD_REVIEWS_KEY, getSampleFoodReviews());
  return all.filter((r) => r.foodId === foodId);
}

function getAllFoodReviews() {
  return readStorage(FOOD_REVIEWS_KEY, getSampleFoodReviews());
}

function saveAllFoodReviews(reviews) {
  writeStorage(FOOD_REVIEWS_KEY, reviews);
}

function canReviewFood(foodId) {
  const user = getCurrentUser();
  if (!user) return false;

  const deliveredWithFood = getUserOrders(user.id).some(
    (order) => isOrderDelivered(order) && order.items.some((item) => item.foodId === foodId)
  );
  if (!deliveredWithFood) return false;

  const alreadyReviewed = getFoodReviews(foodId).some((r) => r.userId === user.id);
  return !alreadyReviewed;
}

function submitFoodReview(foodId, rating, title, comment) {
  const user = getCurrentUser();
  if (!user) {
    showToast("Please log in to write a review.", "warning");
    return null;
  }
  if (!canReviewFood(foodId)) {
    showToast("You can only review dishes from your delivered orders, once each.", "warning");
    return null;
  }
  if (!rating || rating < 1 || rating > 5 || !title.trim() || !comment.trim()) {
    showToast("Please provide a star rating, a title, and a comment.", "error");
    return null;
  }

  const review = {
    id: `frev_${Date.now()}`,
    foodId,
    userId: user.id,
    userName: user.fullName,
    rating: Number(rating),
    title: title.trim(),
    comment: comment.trim(),
    verified: true,
    helpfulCount: 0,
    createdAt: new Date().toISOString(),
  };

  const all = getAllFoodReviews();
  all.push(review);
  saveAllFoodReviews(all);
  showToast("Thanks! Your review has been submitted.", "success");
  return review;
}

function toggleHelpfulVote(reviewId) {
  const votes = readStorage(HELPFUL_VOTES_KEY, []);
  const all = getAllFoodReviews();
  const review = all.find((r) => r.id === reviewId);
  if (!review) return;

  const alreadyVoted = votes.includes(reviewId);
  review.helpfulCount = Math.max(0, (review.helpfulCount || 0) + (alreadyVoted ? -1 : 1));

  const updatedVotes = alreadyVoted ? votes.filter((id) => id !== reviewId) : [...votes, reviewId];
  writeStorage(HELPFUL_VOTES_KEY, updatedVotes);
  saveAllFoodReviews(all);
}

function renderProductReviews(foodId) {
  const reviews = sortFoodReviews(getFoodReviews(foodId), currentReviewSort);
  const container = document.getElementById("productReviewsList");
  const countLabel = document.getElementById("productReviewCount");
  if (countLabel) countLabel.textContent = `(${reviews.length} review${reviews.length === 1 ? "" : "s"})`;

  renderRatingSummary(reviews);
  renderReviewForm(foodId);

  if (!container) return;

  if (!reviews.length) {
    container.innerHTML = `<p class="no-reviews">No reviews yet for this dish. Be the first to review it!</p>`;
    return;
  }

  const helpfulVotes = readStorage(HELPFUL_VOTES_KEY, []);

  container.innerHTML = reviews
    .map(
      (review) => `
      <article class="review-card">
        <div class="review-card-head">
          <div>
            <strong>${review.userName}</strong> ${review.verified ? '<span class="verified-badge"><i class="fa-solid fa-circle-check"></i> Verified Order</span>' : ""}
            <div class="review-stars">${renderStars(review.rating)}</div>
          </div>
          <span class="review-date">${new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
        <h4>${review.title}</h4>
        <p>${review.comment}</p>
        <button class="helpful-btn ${helpfulVotes.includes(review.id) ? "active" : ""}" data-id="${review.id}" type="button">
          <i class="fa-solid fa-thumbs-up"></i> Helpful (${review.helpfulCount || 0})
        </button>
      </article>`
    )
    .join("");

  container.querySelectorAll(".helpful-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleHelpfulVote(btn.dataset.id);
      renderProductReviews(foodId);
    });
  });
}

function renderRatingSummary(reviews) {
  const summaryEl = document.getElementById("ratingDistribution");
  if (!summaryEl) return;

  if (!reviews.length) {
    summaryEl.innerHTML = "";
    return;
  }

  const total = reviews.length;
  const average = (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1);
  const counts = [5, 4, 3, 2, 1].map((star) => reviews.filter((r) => r.rating === star).length);

  summaryEl.innerHTML = `
    <div class="rating-average">
      <span class="rating-average-number">${average}</span>
      <div class="review-stars">${renderStars(Math.round(average))}</div>
      <span class="rating-total">${total} review${total === 1 ? "" : "s"}</span>
    </div>
    <div class="rating-bars">
      ${[5, 4, 3, 2, 1]
        .map((star, i) => {
          const pct = total ? Math.round((counts[i] / total) * 100) : 0;
          return `
          <div class="rating-bar-row">
            <span>${star} <i class="fa-solid fa-star"></i></span>
            <div class="rating-bar-track"><div class="rating-bar-fill" data-pct="${pct}"></div></div>
            <span>${counts[i]}</span>
          </div>`;
        })
        .join("")}
    </div>`;

  // Set bar widths via the DOM instead of inline style attributes in markup.
  summaryEl.querySelectorAll(".rating-bar-fill").forEach((el) => {
    el.style.width = `${el.dataset.pct}%`;
  });
}

function sortFoodReviews(reviews, sortBy) {
  const sorted = reviews.slice();
  if (sortBy === "highest") return sorted.sort((a, b) => b.rating - a.rating);
  if (sortBy === "lowest") return sorted.sort((a, b) => a.rating - b.rating);
  if (sortBy === "helpful") return sorted.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
  return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function setupReviewSortControls(foodId) {
  const select = document.getElementById("reviewSortSelect");
  if (!select) return;
  select.addEventListener("change", () => {
    currentReviewSort = select.value;
    renderProductReviews(foodId);
  });
}

function renderReviewForm(foodId) {
  const container = document.getElementById("writeReviewSection");
  if (!container) return;

  if (!isLoggedIn()) {
    container.innerHTML = `<p class="review-gate-message"><i class="fa-solid fa-circle-info"></i> <a href="login.html">Log in</a> and order this dish to leave a review.</p>`;
    return;
  }

  if (!canReviewFood(foodId)) {
    container.innerHTML = `<p class="review-gate-message"><i class="fa-solid fa-circle-info"></i> You can review this dish after it's delivered in one of your orders (one review per dish).</p>`;
    return;
  }

  container.innerHTML = `
    <h3>Write a Review</h3>
    <div class="star-rating-input" data-rating="0" id="productStarInput">
      ${[1, 2, 3, 4, 5].map((n) => `<i class="fa-regular fa-star" data-star="${n}"></i>`).join("")}
    </div>
    <div class="form-field">
      <label for="productReviewTitle">Review Title</label>
      <input type="text" id="productReviewTitle" />
    </div>
    <div class="form-field">
      <label for="productReviewComment">Comment</label>
      <textarea id="productReviewComment" rows="3"></textarea>
    </div>
    <button class="btn btn-primary btn-small" id="submitProductReviewBtn" type="button">Submit Review</button>`;

  const starInput = document.getElementById("productStarInput");
  starInput.querySelectorAll("i").forEach((star) => {
    star.addEventListener("click", () => {
      const rating = Number(star.dataset.star);
      starInput.dataset.rating = rating;
      starInput.querySelectorAll("i").forEach((s) => {
        const active = Number(s.dataset.star) <= rating;
        s.classList.toggle("fa-solid", active);
        s.classList.toggle("fa-regular", !active);
      });
    });
  });

  document.getElementById("submitProductReviewBtn").addEventListener("click", () => {
    const rating = Number(starInput.dataset.rating);
    const title = document.getElementById("productReviewTitle").value;
    const comment = document.getElementById("productReviewComment").value;

    if (submitFoodReview(foodId, rating, title, comment)) {
      renderProductReviews(foodId);
    }
  });
}

function renderStars(rating) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += `<i class="fa-${i <= rating ? "solid" : "regular"} fa-star"></i>`;
  }
  return html;
}

function getSampleFoodReviews() {
  const sample = [
    {
      id: "frev_sample_1",
      foodId: 1,
      userId: "sample_user_1",
      userName: "Nadia S.",
      rating: 5,
      title: "Perfectly cheesy",
      comment: "Loved the fresh basil and the crust was cooked just right. Ordering again!",
      verified: true,
      helpfulCount: 6,
      createdAt: "2026-06-15T10:00:00.000Z",
    },
    {
      id: "frev_sample_2",
      foodId: 2,
      userId: "sample_user_2",
      userName: "Peter K.",
      rating: 4,
      title: "Solid burger",
      comment: "Great flavor, arrived warm. Would have liked a bit more sauce.",
      verified: true,
      helpfulCount: 3,
      createdAt: "2026-06-01T14:20:00.000Z",
    },
    {
      id: "frev_sample_3",
      foodId: 3,
      userId: "sample_user_3",
      userName: "Hodan A.",
      rating: 5,
      title: "Authentic flavor",
      comment: "Tastes exactly like homemade suqaar. The portion was generous too.",
      verified: true,
      helpfulCount: 9,
      createdAt: "2026-05-22T18:45:00.000Z",
    },
  ];
  writeStorage(FOOD_REVIEWS_KEY, sample);
  return sample;
}

/* ===========================================================
   Recently Viewed
   =========================================================== */
function addToRecentlyViewed(foodId) {
  let recent = readStorage(RECENTLY_VIEWED_KEY, []);
  recent = recent.filter((id) => id !== foodId);
  recent.unshift(foodId);
  recent = recent.slice(0, MAX_RECENTLY_VIEWED);
  writeStorage(RECENTLY_VIEWED_KEY, recent);
}

function clearRecentlyViewed() {
  writeStorage(RECENTLY_VIEWED_KEY, []);
  renderRecentlyViewedSection();
  showToast("Recently viewed history cleared.", "info");
}

function renderRecentlyViewedSection(containerId = "recentlyViewedGrid") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const section = container.closest(".recently-viewed-section");
  const recentIds = readStorage(RECENTLY_VIEWED_KEY, []).filter((id) => id !== (currentProduct && currentProduct.id));
  const items = recentIds.map((id) => foodItems.find((f) => f.id === id)).filter(Boolean);

  if (!items.length) {
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;

  renderFoodCardRow(containerId, items);

  const clearBtn = document.getElementById("clearRecentlyViewedBtn");
  if (clearBtn) clearBtn.addEventListener("click", clearRecentlyViewed);
}

/* ===========================================================
   Recommended for You (simulated - simple rule-based suggestions,
   not an AI recommendation system)
   =========================================================== */
function renderRecommendedSection(containerId = "recommendedGrid") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const section = container.closest(".recommended-section");
  const wishlistCategories = getWishlist()
    .map((id) => foodItems.find((f) => f.id === id))
    .filter(Boolean)
    .map((f) => f.category);

  const orderedCategories = isLoggedIn()
    ? getUserOrders(getCurrentUser().id).flatMap((o) => o.items.map((i) => foodItems.find((f) => f.id === i.foodId)?.category).filter(Boolean))
    : [];

  const recentIds = readStorage(RECENTLY_VIEWED_KEY, []);
  const recentCategories = recentIds.map((id) => foodItems.find((f) => f.id === id)).filter(Boolean).map((f) => f.category);

  const preferredCategories = [...new Set([...wishlistCategories, ...orderedCategories, ...recentCategories])];
  const excludeIds = new Set([...recentIds, ...(currentProduct ? [currentProduct.id] : [])]);

  let recommended = foodItems.filter((f) => preferredCategories.includes(f.category) && !excludeIds.has(f.id));

  // Fall back to top-rated dishes if there isn't enough personalization signal yet.
  if (recommended.length < 4) {
    const fallback = foodItems.filter((f) => !excludeIds.has(f.id) && f.rating >= 4.6);
    recommended = [...new Set([...recommended, ...fallback])];
  }

  recommended = recommended.sort((a, b) => b.rating - a.rating).slice(0, 4);

  if (!recommended.length) {
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;

  renderFoodCardRow(containerId, recommended);
}
