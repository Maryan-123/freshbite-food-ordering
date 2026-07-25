/* ===========================================================
   FreshBite - Cart System
   Reusable cart logic shared across index, restaurants, menu,
   and cart pages. Cart is persisted in localStorage.
   =========================================================== */

const CART_STORAGE_KEY = "freshbite_cart";
const SERVICE_FEE = 1.5;

/* ---------- Broken Image Fallback (site-wide) ---------- */
// Some hosted photo URLs occasionally fail to load. Swap any broken
// <img> for a lightweight inline placeholder so cards never look empty.
const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#FFF1E4"/>
      <g fill="none" stroke="#FF6B35" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="200" cy="140" r="55"/>
        <path d="M170 115 v50 M185 115 v20 a8 8 0 0 0 16 0 v-20"/>
        <path d="M225 115 c14 0 22 12 22 26 c0 10 -6 18 -14 22 v22"/>
      </g>
      <text x="200" y="235" font-family="Poppins, sans-serif" font-size="16" fill="#2D1B12" text-anchor="middle">Image unavailable</text>
    </svg>
  `);

// Image "error" events don't bubble, so listen in the capture phase
// to catch every <img>, including ones injected later by render functions.
document.addEventListener(
  "error",
  (e) => {
    const target = e.target;
    if (target.tagName === "IMG" && target.src !== FALLBACK_IMAGE) {
      target.src = FALLBACK_IMAGE;
    }
  },
  true
);

/* ---------- Core Storage ---------- */
function getCart() {
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartCount();
}

function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
  updateCartCount();
}

/* ---------- Mutations ---------- */
// Every cart line carries a unique cartItemId. Plain (non-customized) adds
// use a deterministic id ("food-<id>") so repeat adds of the same dish merge
// quantities as before. Customized adds (from product.html) get a random id
// so two different customizations of the same dish stay as separate lines.
function generateCartItemId() {
  return `cli_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function addToCart(foodId, options = {}) {
  const food = foodItems.find((f) => f.id === foodId);
  if (!food) return;

  const cart = getCart();

  // Enforce single-restaurant cart rule
  if (cart.length && cart[0].restaurantId !== food.restaurantId) {
    if (typeof options.onConflict === "function") {
      options.onConflict(food);
    }
    return;
  }

  const existing = cart.find((item) => item.foodId === foodId && item.cartItemId === `food-${foodId}`);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      cartItemId: `food-${foodId}`,
      foodId: food.id,
      restaurantId: food.restaurantId,
      name: food.name,
      image: food.image,
      unitPrice: food.price,
      quantity: 1,
      dietaryType: food.dietaryType,
    });
  }

  saveCart(cart);
  if (typeof options.onSuccess === "function") options.onSuccess(food);
  showCartToast(`${food.name} added to cart!`, "fa-solid fa-cart-plus");
}

// Adds a fully customized line (from product.html) as its own cart entry -
// it never merges with a plain add of the same dish, since price/options differ.
function addCustomLineToCart(line) {
  const cart = getCart();

  if (cart.length && cart[0].restaurantId !== line.restaurantId) {
    return { conflict: true };
  }

  cart.push({ cartItemId: generateCartItemId(), ...line });
  saveCart(cart);
  return { conflict: false };
}

function forceStartNewOrder(foodId) {
  const food = foodItems.find((f) => f.id === foodId);
  if (!food) return;

  const cart = [
    {
      cartItemId: `food-${food.id}`,
      foodId: food.id,
      restaurantId: food.restaurantId,
      name: food.name,
      image: food.image,
      unitPrice: food.price,
      quantity: 1,
      dietaryType: food.dietaryType,
    },
  ];

  saveCart(cart);
  showCartToast(`Started a new order with ${food.name}.`, "fa-solid fa-rotate");
}

// Clears the cart and starts a new order with a single custom line (used by
// the restaurant-conflict modal when the pending add was a customized item).
function forceStartNewOrderWithCustomLine(line) {
  const cart = [{ cartItemId: generateCartItemId(), ...line }];
  saveCart(cart);
  showCartToast(`Started a new order with ${line.name}.`, "fa-solid fa-rotate");
}

function removeFromCart(cartItemId) {
  let cart = getCart();
  const item = cart.find((i) => i.cartItemId === cartItemId);
  cart = cart.filter((i) => i.cartItemId !== cartItemId);
  saveCart(cart);
  if (item) showCartToast(`${item.name} removed from cart.`, "fa-solid fa-trash");
}

function increaseQuantity(cartItemId) {
  const cart = getCart();
  const item = cart.find((i) => i.cartItemId === cartItemId);
  if (!item) return;
  item.quantity += 1;
  saveCart(cart);
}

function decreaseQuantity(cartItemId) {
  const cart = getCart();
  const item = cart.find((i) => i.cartItemId === cartItemId);
  if (!item) return;

  if (item.quantity <= 1) {
    removeFromCart(cartItemId);
    return;
  }

  item.quantity -= 1;
  saveCart(cart);
}

function updateQuantity(cartItemId, quantity) {
  const qty = Number(quantity);
  if (qty <= 0) {
    removeFromCart(cartItemId);
    return;
  }

  const cart = getCart();
  const item = cart.find((i) => i.cartItemId === cartItemId);
  if (!item) return;

  item.quantity = qty;
  saveCart(cart);
}

/* ---------- Calculations ---------- */
function calculateSubtotal() {
  return getCart().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

function calculateDeliveryFee(appliedCoupon) {
  const cart = getCart();
  if (!cart.length) return 0;

  if (appliedCoupon && appliedCoupon.discountType === "freeDelivery") return 0;

  const restaurant = restaurants.find((r) => r.id === cart[0].restaurantId);
  return restaurant ? restaurant.deliveryFee : 0;
}

function calculateServiceFee() {
  return getCart().length ? SERVICE_FEE : 0;
}

// PIZZA20 only discounts pizza items; other coupons discount the whole subtotal.
function calculateDiscountEligibleSubtotal(appliedCoupon) {
  const cart = getCart();

  if (appliedCoupon && appliedCoupon.condition === "pizzaOnly") {
    return cart
      .filter((item) => {
        const food = foodItems.find((f) => f.id === item.foodId);
        return food && food.category === "Pizza";
      })
      .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }

  return calculateSubtotal();
}

function calculateDiscount(appliedCoupon) {
  if (!appliedCoupon) return 0;

  const eligibleSubtotal = calculateDiscountEligibleSubtotal(appliedCoupon);
  if (eligibleSubtotal <= 0) return 0;

  if (appliedCoupon.discountType === "percent") {
    return +(eligibleSubtotal * (appliedCoupon.discountValue / 100)).toFixed(2);
  }

  if (appliedCoupon.discountType === "flat") {
    return Math.min(appliedCoupon.discountValue, eligibleSubtotal);
  }

  return 0;
}

/* ---------- Coupon Validation ---------- */
// Centralized rules used by both the cart page and checkout page.
function validateCoupon(codeInput) {
  const code = codeInput.trim().toUpperCase();

  if (!code) {
    return { valid: false, type: "error", message: "Please enter a coupon code." };
  }

  const coupon = coupons.find((c) => c.code === code);

  if (!coupon) {
    return { valid: false, type: "error", message: "This coupon code does not exist." };
  }

  if (!coupon.active) {
    return { valid: false, type: "error", message: "This coupon is no longer active." };
  }

  if (new Date(coupon.expiry) < new Date()) {
    return { valid: false, type: "error", message: "This coupon has expired." };
  }

  const subtotal = calculateSubtotal();
  if (subtotal < coupon.minOrder) {
    return {
      valid: false,
      type: "warning",
      message: `This coupon requires a minimum order of $${coupon.minOrder.toFixed(2)}.`,
    };
  }

  if (coupon.condition === "pizzaOnly") {
    const hasPizza = getCart().some((item) => {
      const food = foodItems.find((f) => f.id === item.foodId);
      return food && food.category === "Pizza";
    });
    if (!hasPizza) {
      return { valid: false, type: "warning", message: "This coupon only applies to orders containing pizza." };
    }
  }

  if (coupon.condition === "firstOrderOnly") {
    const user = getCurrentUser();
    if (!user) {
      return { valid: false, type: "warning", message: "Please log in to use a first-order coupon." };
    }
    if (typeof getUserOrders === "function" && getUserOrders(user.id).length > 0) {
      return { valid: false, type: "warning", message: "This coupon is only valid on your first order." };
    }
  }

  const user = getCurrentUser();
  if (user && typeof getUserOrders === "function") {
    const alreadyUsed = getUserOrders(user.id).some((o) => o.coupon && o.coupon.code === coupon.code);
    if (alreadyUsed) {
      return { valid: false, type: "warning", message: "You've already used this coupon on a previous order." };
    }
  }

  return { valid: true, type: "success", coupon, message: `Coupon applied: ${coupon.description}.` };
}

function calculateTotal(appliedCoupon) {
  const subtotal = calculateSubtotal();
  const delivery = calculateDeliveryFee(appliedCoupon);
  const service = calculateServiceFee();
  const discount = calculateDiscount(appliedCoupon);
  const total = subtotal + delivery + service - discount;
  return Math.max(total, 0);
}

/* ---------- UI Sync ---------- */
function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = count;
  });
}

function renderCart(containerId = "cartItemsList") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const cart = getCart();

  if (!cart.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = cart
    .map((item) => {
      const customizationBits = [];
      if (item.size) customizationBits.push(item.size);
      if (item.extras && item.extras.length) customizationBits.push(item.extras.join(", "));
      const customizationLine = customizationBits.length
        ? `<p class="cart-item-customization">${customizationBits.join(" &bull; ")}</p>`
        : "";
      const instructionsLine = item.instructions
        ? `<p class="cart-item-instructions"><i class="fa-solid fa-note-sticky"></i> ${item.instructions}</p>`
        : "";

      return `
      <article class="cart-item" data-id="${item.cartItemId}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img" loading="lazy" />
        <div class="cart-item-info">
          <h3>${item.name}</h3>
          <p class="cart-item-restaurant">${getRestaurantName(item.restaurantId)}</p>
          <p class="cart-item-tag">${item.dietaryType}</p>
          ${customizationLine}
          ${instructionsLine}
        </div>
        <div class="cart-item-price">$${item.unitPrice.toFixed(2)}</div>
        <div class="qty-controls">
          <button class="qty-btn decrease-btn" data-id="${item.cartItemId}" aria-label="Decrease quantity">
            <i class="fa-solid fa-minus"></i>
          </button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn increase-btn" data-id="${item.cartItemId}" aria-label="Increase quantity">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
        <div class="cart-item-subtotal">$${(item.unitPrice * item.quantity).toFixed(2)}</div>
        <button class="remove-btn" data-id="${item.cartItemId}" aria-label="Remove item">
          <i class="fa-solid fa-trash"></i>
        </button>
      </article>`;
    }
    )
    .join("");
}

function getRestaurantName(restaurantId) {
  const restaurant = restaurants.find((r) => r.id === restaurantId);
  return restaurant ? restaurant.name : "";
}

/* ---------- Toast (shared, minimal duplicate of script.js) ---------- */
let cartToastTimeout;

function showCartToast(text, iconClass = "fa-solid fa-circle-check") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerHTML = `<i class="${iconClass}"></i> ${text}`;
  toast.classList.add("show");

  clearTimeout(cartToastTimeout);
  cartToastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

/* ---------- Restaurant Conflict Modal ---------- */
let pendingFoodId = null;
let pendingCustomLine = null;

function requestAddToCart(foodId) {
  addToCart(foodId, {
    onConflict: () => {
      pendingFoodId = foodId;
      const modal = document.getElementById("conflictModal");
      if (modal) modal.classList.add("show");
    },
  });
}

// Used by product.html for customized (size/extras/instructions) adds.
function requestAddCustomLineToCart(line) {
  const result = addCustomLineToCart(line);

  if (result.conflict) {
    pendingCustomLine = line;
    const modal = document.getElementById("conflictModal");
    if (modal) modal.classList.add("show");
    return;
  }

  showCartToast(`${line.name} added to cart!`, "fa-solid fa-cart-plus");
}

function setupConflictModal() {
  const modal = document.getElementById("conflictModal");
  if (!modal) return;

  const cancelBtn = document.getElementById("modalCancelBtn");
  const confirmBtn = document.getElementById("modalConfirmBtn");

  cancelBtn.addEventListener("click", () => {
    pendingFoodId = null;
    pendingCustomLine = null;
    modal.classList.remove("show");
  });

  confirmBtn.addEventListener("click", () => {
    if (pendingCustomLine !== null) {
      forceStartNewOrderWithCustomLine(pendingCustomLine);
      pendingCustomLine = null;
    } else if (pendingFoodId !== null) {
      forceStartNewOrder(pendingFoodId);
      pendingFoodId = null;
    }
    modal.classList.remove("show");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      pendingFoodId = null;
      pendingCustomLine = null;
      modal.classList.remove("show");
    }
  });
}

/* ===========================================================
   Cart Page (cart.html) - Order Summary, Coupons, Checkout
   =========================================================== */

let appliedCoupon = null;

function initCartPage() {
  if (!document.getElementById("cartItemsList")) return;

  renderCartPage();

  document.getElementById("applyCouponBtn").addEventListener("click", handleApplyCoupon);
  document.getElementById("checkoutBtn").addEventListener("click", handleCheckout);

  document.getElementById("cartItemsList").addEventListener("click", (e) => {
    const increaseBtn = e.target.closest(".increase-btn");
    const decreaseBtn = e.target.closest(".decrease-btn");
    const removeBtn = e.target.closest(".remove-btn");

    if (increaseBtn) {
      increaseQuantity(increaseBtn.dataset.id);
      renderCartPage();
    } else if (decreaseBtn) {
      decreaseQuantity(decreaseBtn.dataset.id);
      renderCartPage();
    } else if (removeBtn) {
      removeFromCart(removeBtn.dataset.id);
      renderCartPage();
    }
  });
}

function renderCartPage() {
  const cart = getCart();
  const itemsPanel = document.querySelector(".cart-items-panel");
  const itemsHeader = document.querySelector(".cart-items-header");
  const emptyState = document.getElementById("emptyCartState");
  const orderSummary = document.getElementById("orderSummary");
  const banner = document.getElementById("cartRestaurantBanner");

  if (!cart.length) {
    itemsHeader.style.display = "none";
    emptyState.style.display = "flex";
    orderSummary.style.display = "none";
    banner.innerHTML = "";
    document.getElementById("cartItemsList").innerHTML = "";
    appliedCoupon = null;
    return;
  }

  itemsHeader.style.display = "grid";
  emptyState.style.display = "none";
  orderSummary.style.display = "flex";

  const restaurant = restaurants.find((r) => r.id === cart[0].restaurantId);
  banner.innerHTML = restaurant
    ? `<i class="fa-solid fa-store"></i> Ordering from <strong>${restaurant.name}</strong>`
    : "";

  renderCart("cartItemsList");
  updateOrderSummary();
}

function updateOrderSummary() {
  const subtotal = calculateSubtotal();
  const delivery = calculateDeliveryFee(appliedCoupon);
  const service = calculateServiceFee();
  const discount = calculateDiscount(appliedCoupon);
  const total = calculateTotal(appliedCoupon);

  document.getElementById("summarySubtotal").textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("summaryDelivery").textContent = `$${delivery.toFixed(2)}`;
  document.getElementById("summaryService").textContent = `$${service.toFixed(2)}`;
  document.getElementById("summaryDiscount").textContent = `-$${discount.toFixed(2)}`;
  document.getElementById("summaryTotal").textContent = `$${total.toFixed(2)}`;

  const discountRow = document.getElementById("discountRow");
  discountRow.style.display = discount > 0 ? "flex" : "none";
}

function handleApplyCoupon() {
  const input = document.getElementById("couponInput");
  const message = document.getElementById("couponMessage");

  const result = validateCoupon(input.value);

  message.classList.remove("success", "error", "warning");
  message.textContent = result.message;
  message.classList.add(result.type === "success" ? "success" : "error");

  appliedCoupon = result.valid ? result.coupon : null;
  if (typeof showToast === "function") {
    showToast(result.message, result.valid ? "success" : result.type);
  }

  updateOrderSummary();
}

function handleCheckout() {
  const cart = getCart();
  if (!cart.length) {
    showCartToast("Your cart is empty. Add items before checking out.", "fa-solid fa-circle-info");
    return;
  }
  window.location.href = "checkout.html";
}

// Keep the navbar cart count accurate and wire up shared cart-driven UI
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  setupConflictModal();
  initCartPage();
});
