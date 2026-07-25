/* ===========================================================
   FreshBite - Offers Page
   Renders promotional offer cards from specialOffers + coupons,
   with category filters, copy-to-clipboard, and expiry handling.
   =========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("offersGrid")) return;
  renderOffersPage("all");
  setupOfferFilters();
});

// Merges the two existing data sources (specialOffers + coupons) into one
// unified offer card model so the page can filter/sort them together.
function getUnifiedOffers() {
  const fromSpecialOffers = specialOffers.map((o) => ({
    id: `so_${o.id}`,
    title: o.title,
    description: o.description,
    code: o.code,
    icon: o.icon,
    expiry: o.expiry,
    discountLabel: o.discount,
    minOrder: 0,
    scope: guessOfferScope(o.title, o.code),
    active: true,
  }));

  const fromCoupons = coupons.map((c) => ({
    id: `cp_${c.code}`,
    title: couponTitleFromCode(c.code),
    description: c.description,
    code: c.code,
    icon: "fa-solid fa-tags",
    expiry: c.expiry,
    discountLabel:
      c.discountType === "percent" ? `${c.discountValue}% off` : c.discountType === "flat" ? `$${c.discountValue} off` : "Free delivery",
    minOrder: c.minOrder,
    scope: c.condition === "pizzaOnly" ? "category" : c.condition === "firstOrderOnly" ? "new-user" : "restaurant",
    active: c.active,
  }));

  // Avoid showing the same coupon code twice if it appears in both arrays.
  const seenCodes = new Set();
  return [...fromCoupons, ...fromSpecialOffers].filter((offer) => {
    if (seenCodes.has(offer.code)) return false;
    seenCodes.add(offer.code);
    return true;
  });
}

function guessOfferScope(title, code) {
  const text = `${title} ${code}`.toLowerCase();
  if (text.includes("delivery")) return "free-delivery";
  if (text.includes("pizza") || text.includes("bogo")) return "category";
  if (text.includes("welcome") || text.includes("first")) return "new-user";
  return "restaurant";
}

function couponTitleFromCode(code) {
  const titles = {
    FRESH10: "10% Off Your Order",
    WELCOME5: "$5 Off Your Order",
    FREEDELIVERY: "Free Delivery",
    PIZZA20: "20% Off Pizza",
    FIRSTORDER: "First Order Discount",
  };
  return titles[code] || code;
}

function isOfferExpired(expiry) {
  return new Date(expiry) < new Date();
}

function isExpiringSoon(expiry) {
  const daysLeft = (new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24);
  return daysLeft > 0 && daysLeft <= 14;
}

/* ---------- Filters ---------- */
function setupOfferFilters() {
  document.querySelectorAll(".offer-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".offer-filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderOffersPage(btn.dataset.filter);
    });
  });
}

function renderOffersPage(filter) {
  let offers = getUnifiedOffers();

  if (filter === "restaurant") offers = offers.filter((o) => o.scope === "restaurant");
  else if (filter === "category") offers = offers.filter((o) => o.scope === "category");
  else if (filter === "free-delivery") offers = offers.filter((o) => o.scope === "free-delivery");
  else if (filter === "new-user") offers = offers.filter((o) => o.scope === "new-user");
  else if (filter === "expiring") offers = offers.filter((o) => isExpiringSoon(o.expiry) && !isOfferExpired(o.expiry));

  renderOfferCards(offers);
}

function renderOfferCards(offers) {
  const grid = document.getElementById("offersGrid");

  if (!offers.length) {
    grid.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-tags"></i>
        <h3>No offers match this filter</h3>
        <p>Check back soon - FreshBite adds new deals regularly.</p>
      </div>`;
    return;
  }

  grid.innerHTML = offers
    .map((offer) => {
      const expired = isOfferExpired(offer.expiry);
      const expiringSoon = !expired && isExpiringSoon(offer.expiry);

      return `
      <article class="offer-card page-offer-card ${expired ? "offer-expired" : ""}">
        <span class="offer-icon"><i class="${offer.icon}"></i></span>
        <h3>${offer.title}</h3>
        <p>${offer.description}</p>

        <div class="offer-terms">
          <span><i class="fa-solid fa-sack-dollar"></i> Min. order: $${offer.minOrder.toFixed(2)}</span>
          <span><i class="fa-solid fa-store"></i> ${offerScopeLabel(offer.scope)}</span>
        </div>

        <div class="offer-meta">
          <span class="offer-code">${offer.code}</span>
          <span class="offer-expiry ${expiringSoon ? "expiry-soon" : ""}">
            <i class="fa-regular fa-clock"></i> ${expired ? "Expired" : expiringSoon ? "Expiring Soon" : "Valid until"} ${formatOfferDate(offer.expiry)}
          </span>
        </div>

        <div class="offer-card-actions">
          <button class="btn btn-outline btn-small copy-code-btn" data-code="${offer.code}" type="button" ${expired ? "disabled" : ""}>
            <i class="fa-regular fa-copy"></i> Copy Code
          </button>
          <a class="btn btn-primary btn-small" href="restaurants.html" ${expired ? "aria-disabled='true' tabindex='-1'" : ""}>
            Shop Now
          </a>
        </div>

        ${expired ? '<span class="expired-ribbon">Expired</span>' : ""}
      </article>`;
    })
    .join("");

  grid.querySelectorAll(".copy-code-btn:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => copyOfferCode(btn.dataset.code));
  });
}

function offerScopeLabel(scope) {
  const labels = {
    restaurant: "All restaurants",
    category: "Selected categories",
    "free-delivery": "Free delivery",
    "new-user": "New customers only",
  };
  return labels[scope] || "All restaurants";
}

function formatOfferDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function copyOfferCode(code) {
  try {
    await navigator.clipboard.writeText(code);
    showToast(`Coupon code "${code}" copied to clipboard!`, "success");
  } catch (err) {
    showToast(`Coupon code: ${code} (copy manually - clipboard access was blocked).`, "info");
  }
}
