/* ===========================================================
   FreshBite - Account Dashboard
   Profile editing, order history, saved addresses, wishlist,
   and "my reviews" - all scoped to the logged-in user.
   =========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  if (!requireLogin()) return;

  setupTabs();
  loadProfile();
  renderOrderHistory();
  renderAddresses();
  renderWishlistPanel("wishlistGrid");
  renderMyReviews();
  setupProfileForm();
  setupAddressForm();
  setupLogoutButtons();
});

/* ---------- Tabs ---------- */
function setupTabs() {
  const tabButtons = document.querySelectorAll(".account-tab-btn[data-tab]");
  const panels = document.querySelectorAll(".account-panel");

  function activateTab(tabName) {
    tabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabName));
    panels.forEach((panel) => panel.classList.toggle("active", panel.id === `panel-${tabName}`));
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activateTab(btn.dataset.tab);
      window.location.hash = btn.dataset.tab;
    });
  });

  const initialTab = window.location.hash ? window.location.hash.replace("#", "") : "profile";
  if (document.getElementById(`panel-${initialTab}`)) {
    activateTab(initialTab);
  }
}

/* ---------- Profile ---------- */
function loadProfile() {
  const user = getCurrentUser();
  if (!user) return;

  document.getElementById("profileName").value = user.fullName;
  document.getElementById("profileEmail").value = user.email;
  document.getElementById("profilePhone").value = user.phone;
  document.getElementById("settingsEmail").textContent = user.email;
}

function setupProfileForm() {
  const form = document.getElementById("profileForm");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fullName = document.getElementById("profileName").value.trim();
    const email = document.getElementById("profileEmail").value.trim();
    const phone = document.getElementById("profilePhone").value.trim();

    document.getElementById("profileNameError").textContent = "";
    document.getElementById("profileEmailError").textContent = "";
    document.getElementById("profilePhoneError").textContent = "";

    let hasError = false;
    if (!fullName) {
      document.getElementById("profileNameError").textContent = "Full name is required.";
      hasError = true;
    }
    if (!email || !isValidEmail(email)) {
      document.getElementById("profileEmailError").textContent = "Enter a valid email address.";
      hasError = true;
    }
    if (!phone || !isValidPhone(phone)) {
      document.getElementById("profilePhoneError").textContent = "Enter a valid phone number.";
      hasError = true;
    }

    if (hasError) {
      showToast("Please fix the highlighted fields.", "error");
      return;
    }

    updateCurrentUser({ fullName, email: email.toLowerCase(), phone });
    document.getElementById("settingsEmail").textContent = email;
    showToast("Profile updated successfully.", "success");
    renderNavAuthUI();
  });
}

/* ---------- Order History ---------- */
function renderOrderHistory() {
  const container = document.getElementById("orderHistoryList");
  const user = getCurrentUser();
  const orders = getUserOrders(user.id);

  if (!orders.length) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-receipt"></i>
        <h3>No orders yet</h3>
        <p>Your past orders will show up here once you place one.</p>
        <a href="restaurants.html" class="btn btn-primary">Browse Restaurants</a>
      </div>`;
    return;
  }

  container.innerHTML = orders
    .map((order) => {
      const canReview = isOrderDelivered(order) && !hasReviewedOrder(order.id);
      return `
      <article class="order-card">
        <div class="order-card-head">
          <div>
            <strong>${order.id}</strong>
            <span class="order-date">${new Date(order.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>
          </div>
          <span class="status-pill status-${order.statusIndex}">${order.status}</span>
        </div>

        <p class="order-restaurant"><i class="fa-solid fa-store"></i> ${order.restaurantName}</p>

        <ul class="order-items-summary">
          ${order.items.map((item) => `<li>${item.quantity}x ${item.name}</li>`).join("")}
        </ul>

        <div class="order-meta-grid">
          <span><i class="fa-solid fa-credit-card"></i> ${paymentMethodLabel(order.paymentMethod)}</span>
          <span><i class="fa-solid fa-location-dot"></i> ${order.delivery.street}, ${order.delivery.city}</span>
          <span><i class="fa-solid fa-sack-dollar"></i> Total: $${order.total.toFixed(2)}</span>
        </div>

        <div class="order-card-actions">
          <a class="btn btn-outline btn-small" href="order-tracking.html?orderId=${order.id}">
            <i class="fa-solid fa-truck-fast"></i> Track Order
          </a>
          <button class="btn btn-outline btn-small view-details-btn" data-id="${order.id}" type="button">
            <i class="fa-solid fa-eye"></i> View Details
          </button>
          <button class="btn btn-primary btn-small reorder-btn" data-id="${order.id}" type="button">
            <i class="fa-solid fa-rotate"></i> Reorder
          </button>
          ${
            canReview
              ? `<button class="btn btn-outline btn-small write-review-btn" data-id="${order.id}" data-restaurant="${order.restaurantId}" type="button">
                  <i class="fa-solid fa-star"></i> Write a Review
                </button>`
              : ""
          }
        </div>

        <div class="order-details" id="details-${order.id}" hidden>
          ${order.items
            .map(
              (item) => `<div class="checkout-item-row">
                <img src="${item.image}" alt="${item.name}" loading="lazy" />
                <div class="checkout-item-info">
                  <span class="checkout-item-name">${item.name}</span>
                  <span class="checkout-item-qty">Qty: ${item.quantity} &times; $${item.unitPrice.toFixed(2)}</span>
                </div>
                <span class="checkout-item-subtotal">$${(item.unitPrice * item.quantity).toFixed(2)}</span>
              </div>`
            )
            .join("")}
          <div class="summary-row"><span>Subtotal</span><span>$${order.subtotal.toFixed(2)}</span></div>
          <div class="summary-row"><span>Delivery Fee</span><span>$${order.deliveryFee.toFixed(2)}</span></div>
          <div class="summary-row"><span>Service Fee</span><span>$${order.serviceFee.toFixed(2)}</span></div>
          <div class="summary-row"><span>Discount</span><span>-$${order.discount.toFixed(2)}</span></div>
          <div class="summary-row summary-total"><span>Total</span><span>$${order.total.toFixed(2)}</span></div>
        </div>

        <form class="review-form" id="reviewForm-${order.id}" hidden></form>
      </article>`;
    })
    .join("");

  container.querySelectorAll(".view-details-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const details = document.getElementById(`details-${btn.dataset.id}`);
      details.hidden = !details.hidden;
    });
  });

  container.querySelectorAll(".reorder-btn").forEach((btn) => {
    btn.addEventListener("click", () => reorder(btn.dataset.id));
  });

  container.querySelectorAll(".write-review-btn").forEach((btn) => {
    btn.addEventListener("click", () => openReviewForm(btn.dataset.id, Number(btn.dataset.restaurant), btn));
  });
}

function paymentMethodLabel(method) {
  const labels = { cod: "Cash on Delivery", card: "Card Payment", mobile: "Mobile Payment" };
  return labels[method] || method;
}

function openReviewForm(orderId, restaurantId, triggerBtn) {
  const form = document.getElementById(`reviewForm-${orderId}`);
  if (!form) return;

  form.hidden = false;
  triggerBtn.hidden = true;

  form.innerHTML = `
    <h4>Write a Review</h4>
    <div class="star-rating-input" data-rating="0">
      ${[1, 2, 3, 4, 5].map((n) => `<i class="fa-regular fa-star" data-star="${n}"></i>`).join("")}
    </div>
    <div class="form-field">
      <label for="reviewTitle-${orderId}">Review Title</label>
      <input type="text" id="reviewTitle-${orderId}" required />
    </div>
    <div class="form-field">
      <label for="reviewComment-${orderId}">Comment</label>
      <textarea id="reviewComment-${orderId}" rows="3" required></textarea>
    </div>
    <button type="submit" class="btn btn-primary btn-small">Submit Review</button>`;

  const starContainer = form.querySelector(".star-rating-input");
  starContainer.querySelectorAll("i").forEach((star) => {
    star.addEventListener("click", () => {
      const rating = Number(star.dataset.star);
      starContainer.dataset.rating = rating;
      starContainer.querySelectorAll("i").forEach((s) => {
        const active = Number(s.dataset.star) <= rating;
        s.classList.toggle("fa-solid", active);
        s.classList.toggle("fa-regular", !active);
      });
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const rating = Number(starContainer.dataset.rating);
    const title = document.getElementById(`reviewTitle-${orderId}`).value;
    const comment = document.getElementById(`reviewComment-${orderId}`).value;

    const review = submitReview({ orderId, restaurantId, rating, title, comment });
    if (review) {
      form.hidden = true;
      renderMyReviews();
    }
  });
}

/* ---------- Addresses ---------- */
function renderAddresses() {
  const container = document.getElementById("addressList");
  const addresses = getSavedAddresses();

  if (!addresses.length) {
    container.innerHTML = `<p class="no-address-message">You haven't saved any addresses yet.</p>`;
    return;
  }

  container.innerHTML = addresses
    .map(
      (addr) => `
      <article class="address-card ${addr.isDefault ? "is-default" : ""}">
        <div class="address-card-head">
          <span class="address-label-tag"><i class="fa-solid fa-location-dot"></i> ${addr.label}</span>
          ${addr.isDefault ? '<span class="default-tag">Default</span>' : ""}
        </div>
        <p>${addr.street}${addr.apartment ? `, ${addr.apartment}` : ""}</p>
        <p>${addr.area}, ${addr.city}</p>
        ${addr.instructions ? `<p class="address-instructions">${addr.instructions}</p>` : ""}
        <div class="address-card-actions">
          ${!addr.isDefault ? `<button class="btn-link set-default-btn" data-id="${addr.id}" type="button">Set as Default</button>` : ""}
          <button class="btn-link edit-address-btn" data-id="${addr.id}" type="button">Edit</button>
          <button class="btn-link delete-address-btn" data-id="${addr.id}" type="button">Delete</button>
        </div>
      </article>`
    )
    .join("");

  container.querySelectorAll(".set-default-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setDefaultAddress(btn.dataset.id);
      renderAddresses();
      showToast("Default address updated.", "success");
    });
  });

  container.querySelectorAll(".delete-address-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteAddress(btn.dataset.id);
      renderAddresses();
      showToast("Address deleted.", "info");
    });
  });

  container.querySelectorAll(".edit-address-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const addr = getSavedAddresses().find((a) => a.id === btn.dataset.id);
      if (addr) openAddressForm(addr);
    });
  });
}

function setupAddressForm() {
  const form = document.getElementById("addressForm");

  document.getElementById("addAddressBtn").addEventListener("click", () => openAddressForm());
  document.getElementById("cancelAddressBtn").addEventListener("click", () => closeAddressForm());

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const street = document.getElementById("addrStreet").value.trim();
    const area = document.getElementById("addrArea").value.trim();
    const city = document.getElementById("addrCity").value.trim();

    document.getElementById("addrStreetError").textContent = "";
    document.getElementById("addrAreaError").textContent = "";
    document.getElementById("addrCityError").textContent = "";

    let hasError = false;
    if (!street) {
      document.getElementById("addrStreetError").textContent = "Street is required.";
      hasError = true;
    }
    if (!area) {
      document.getElementById("addrAreaError").textContent = "Area is required.";
      hasError = true;
    }
    if (!city) {
      document.getElementById("addrCityError").textContent = "City is required.";
      hasError = true;
    }
    if (hasError) {
      showToast("Please fix the highlighted fields.", "error");
      return;
    }

    const addressData = {
      label: document.getElementById("addrLabel").value,
      street,
      apartment: document.getElementById("addrApartment").value.trim(),
      area,
      city,
      instructions: document.getElementById("addrInstructions").value.trim(),
      isDefault: document.getElementById("addrIsDefault").checked,
    };

    const existingId = document.getElementById("addressId").value;

    if (existingId) {
      updateAddress(existingId, addressData);
      showToast("Address updated.", "success");
    } else {
      saveAddress(addressData);
      showToast("Address saved.", "success");
    }

    closeAddressForm();
    renderAddresses();
  });
}

function openAddressForm(address) {
  const form = document.getElementById("addressForm");
  form.hidden = false;
  document.getElementById("addressFormTitle").textContent = address ? "Edit Address" : "Add Address";
  document.getElementById("addressId").value = address ? address.id : "";
  document.getElementById("addrLabel").value = address ? address.label : "Home";
  document.getElementById("addrStreet").value = address ? address.street : "";
  document.getElementById("addrApartment").value = address ? address.apartment || "" : "";
  document.getElementById("addrArea").value = address ? address.area : "";
  document.getElementById("addrCity").value = address ? address.city : "";
  document.getElementById("addrInstructions").value = address ? address.instructions || "" : "";
  document.getElementById("addrIsDefault").checked = address ? !!address.isDefault : false;
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function closeAddressForm() {
  document.getElementById("addressForm").hidden = true;
  document.getElementById("addressForm").reset();
}

/* ---------- My Reviews ---------- */
function renderMyReviews() {
  const container = document.getElementById("myReviewsList");
  const user = getCurrentUser();
  const reviews = getReviewsByUser(user.id);

  if (!reviews.length) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-star-half-stroke"></i>
        <h3>No reviews yet</h3>
        <p>After a delivered order, you can rate and review it from your Order History tab.</p>
      </div>`;
    return;
  }

  container.innerHTML = reviews
    .map((review) => {
      const restaurant = restaurants.find((r) => r.id === review.restaurantId);
      return `
      <article class="review-card">
        <div class="review-card-head">
          <div>
            <strong>${restaurant ? restaurant.name : "FreshBite Restaurant"}</strong>
            <div class="review-stars">${renderStars(review.rating)}</div>
          </div>
          <span class="review-date">${new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
        <h4>${review.title}</h4>
        <p>${review.comment}</p>
        <button class="delete-review-btn" data-id="${review.id}" type="button"><i class="fa-solid fa-trash"></i> Delete</button>
      </article>`;
    })
    .join("");

  container.querySelectorAll(".delete-review-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (deleteReview(btn.dataset.id)) renderMyReviews();
    });
  });
}

/* ---------- Logout ---------- */
function setupLogoutButtons() {
  document.getElementById("accountLogoutBtn").addEventListener("click", logoutUser);
  document.getElementById("settingsLogoutBtn").addEventListener("click", logoutUser);
}
