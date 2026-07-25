/* ===========================================================
   FreshBite - Wishlist System
   Wishlist data belongs to the logged-in user. Guests get a
   temporary "guest" wishlist (kept in localStorage under its own
   key) so the heart buttons still work before signing in, but a
   toast invites them to log in so it isn't lost. On login, the
   guest wishlist is merged into the user's saved wishlist.
   =========================================================== */

const GUEST_WISHLIST_KEY = `${STORAGE_KEYS.WISHLIST_PREFIX}guest`;

function getWishlistKey() {
  const user = getCurrentUser();
  return user ? `${STORAGE_KEYS.WISHLIST_PREFIX}${user.id}` : GUEST_WISHLIST_KEY;
}

function getWishlist() {
  return readStorage(getWishlistKey(), []);
}

function saveWishlist(ids) {
  writeStorage(getWishlistKey(), ids);
}

function isInWishlist(foodId) {
  return getWishlist().includes(foodId);
}

function toggleWishlist(foodId) {
  const food = foodItems.find((f) => f.id === foodId);
  if (!food) return false;

  let wishlist = getWishlist();
  const alreadyIn = wishlist.includes(foodId);

  if (alreadyIn) {
    wishlist = wishlist.filter((id) => id !== foodId);
    saveWishlist(wishlist);
    showToast(`${food.name} removed from wishlist.`, "info");
    return false;
  }

  // Prevent duplicate entries
  wishlist.push(foodId);
  saveWishlist(wishlist);

  if (isLoggedIn()) {
    showToast(`${food.name} added to wishlist!`, "success");
  } else {
    showToast(`${food.name} added to wishlist. Log in to keep it saved to your account.`, "info");
  }

  return true;
}

// Merge the guest wishlist into the user's wishlist right after login/registration.
function mergeGuestWishlistIntoUser() {
  const user = getCurrentUser();
  if (!user) return;

  const guestWishlist = readStorage(GUEST_WISHLIST_KEY, []);
  if (!guestWishlist.length) return;

  const userKey = `${STORAGE_KEYS.WISHLIST_PREFIX}${user.id}`;
  const userWishlist = readStorage(userKey, []);
  const merged = [...new Set([...userWishlist, ...guestWishlist])];

  writeStorage(userKey, merged);
  removeStorage(GUEST_WISHLIST_KEY);
}

/* ---------- UI Hook: wishlist heart buttons ---------- */
// Call after rendering any set of food cards that include
// a `.wishlist-btn[data-id]` element, to wire up click behavior.
function attachWishlistButtons(root = document) {
  root.querySelectorAll(".wishlist-btn").forEach((btn) => {
    const foodId = Number(btn.dataset.id);
    syncWishlistButtonState(btn, foodId);

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const nowActive = toggleWishlist(foodId);
      syncWishlistButtonState(btn, foodId, nowActive);
    });
  });
}

function syncWishlistButtonState(btn, foodId, knownState) {
  const active = knownState !== undefined ? knownState : isInWishlist(foodId);
  const icon = btn.querySelector("i");

  btn.classList.toggle("active", active);
  if (icon) {
    icon.classList.toggle("fa-solid", active);
    icon.classList.toggle("fa-regular", !active);
  }
}

/* ---------- Render: Wishlist tab (account.html) ---------- */
function renderWishlistPanel(containerId = "wishlistGrid") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const wishlistIds = getWishlist();
  const items = foodItems.filter((f) => wishlistIds.includes(f.id));

  if (!items.length) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-heart-crack"></i>
        <h3>Your wishlist is empty</h3>
        <p>Tap the heart icon on any dish to save it here for later.</p>
        <a href="restaurants.html" class="btn btn-primary">Browse Restaurants</a>
      </div>`;
    return;
  }

  container.innerHTML = items
    .map(
      (food) => `
      <article class="food-card">
        <div class="food-img-wrap">
          <img src="${food.image}" alt="${food.name}" loading="lazy" />
          <span class="dietary-tag">${food.dietaryType}</span>
          <button class="wishlist-btn active" data-id="${food.id}" aria-label="Remove from wishlist" type="button">
            <i class="fa-solid fa-heart"></i>
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
      </article>`
    )
    .join("");

  container.querySelectorAll(".add-cart-btn").forEach((btn) => {
    btn.addEventListener("click", () => requestAddToCart(Number(btn.dataset.id)));
  });

  attachWishlistButtons(container);
}
