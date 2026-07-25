/* ===========================================================
   FreshBite - FAQ Page
   Keyboard-accessible accordion, live search, and category
   filters over a static FAQ dataset defined in this file.
   =========================================================== */

const FAQ_DATA = [
  { category: "Ordering", question: "How do I place an order?", answer: "Browse restaurants, open a menu, add dishes to your cart, then go to checkout to confirm your delivery details and payment method." },
  { category: "Ordering", question: "Can I order from two restaurants at once?", answer: "No - to keep delivery times accurate, FreshBite only allows items from one restaurant per order. Adding a dish from a different restaurant will prompt you to start a new order." },
  { category: "Ordering", question: "Can I customize my food?", answer: "Yes! On any dish's product page you can choose a size, spice level, extras like cheese or sauce, and add special instructions before adding it to your cart." },
  { category: "Delivery", question: "How long does delivery take?", answer: "Most orders arrive within 20-45 minutes depending on your delivery method and the restaurant's preparation time. You can also schedule a delivery for later." },
  { category: "Delivery", question: "Can I track my order?", answer: "Yes - every order includes simulated live tracking through five stages, from Order Confirmed to Delivered, available on the Order Tracking page." },
  { category: "Delivery", question: "What if no one is home?", answer: "Add delivery instructions at checkout (e.g. \"leave at the door\") so your rider knows what to do if they can't reach you." },
  { category: "Payments", question: "What payment methods are supported?", answer: "This demo supports simulated Cash on Delivery, Card payment, and Mobile Payment. No real transactions are processed and card details are never stored." },
  { category: "Payments", question: "Is my card information safe?", answer: "Since this is a portfolio/learning project, no real payment processing happens at all - card numbers and CVV codes are validated for format only and are never saved anywhere." },
  { category: "Account", question: "Do I need an account to order?", answer: "You can browse freely without an account, but registering lets you save addresses, track order history, build a wishlist, and write reviews." },
  { category: "Account", question: "How do I reset my password?", answer: "The \"Forgot password\" link on the login page is simulated for this demo - in a real product it would email you a reset link." },
  { category: "Coupons", question: "What coupon codes can I try?", answer: "Try FRESH10 (10% off), WELCOME5 ($5 off), FREEDELIVERY (no delivery fee), PIZZA20 (20% off pizza items), or FIRSTORDER (first-order discount)." },
  { category: "Coupons", question: "Why did my coupon get rejected?", answer: "Coupons can be rejected if they've expired, your order is below the minimum amount, the coupon doesn't apply to your cart's items, or you've already used it on a previous order." },
  { category: "Refunds", question: "How do refunds work?", answer: "This is a simulated refund flow for demonstration only - no real money moves. In a production system, refunds would be issued back to the original payment method." },
  { category: "Refunds", question: "What if my order arrives wrong or late?", answer: "In this demo, you can use the Contact page to open a support ticket describing the issue, and our (simulated) support team will follow up." },
  { category: "Restaurants", question: "How do I become a restaurant partner?", answer: "Reach out through the Contact page and select \"Restaurant Partnership\" as your reason - our partnerships team will follow up." },
  { category: "Restaurants", question: "Can I filter restaurants by rating or delivery time?", answer: "Yes - the Restaurants page includes filters for cuisine, minimum rating, price level, delivery time, free delivery, and open-now status." },
  { category: "Food Safety", question: "Are ingredients and allergens listed?", answer: "Each dish's product page lists simulated ingredients and common allergens so you can make an informed choice." },
  { category: "Food Safety", question: "How is food kept fresh during delivery?", answer: "Our (simulated) delivery partners use insulated bags and prioritize the shortest possible route from kitchen to your door." },
];

let activeFaqCategory = "all";

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("faqList")) return;
  populateFaqCategoryButtons();
  renderFaqList(FAQ_DATA);
  setupFaqSearch();
  setupFaqCategoryFilters();
});

function populateFaqCategoryButtons() {
  const container = document.getElementById("faqCategoryFilters");
  const categories = [...new Set(FAQ_DATA.map((item) => item.category))];

  container.innerHTML =
    `<button class="offer-filter-btn active" data-category="all" type="button">All</button>` +
    categories.map((cat) => `<button class="offer-filter-btn" data-category="${cat}" type="button">${cat}</button>`).join("");
}

function setupFaqCategoryFilters() {
  document.getElementById("faqCategoryFilters").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-category]");
    if (!btn) return;

    document.querySelectorAll("#faqCategoryFilters button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFaqCategory = btn.dataset.category;
    applyFaqFilters();
  });
}

function setupFaqSearch() {
  const input = document.getElementById("faqSearchInput");
  input.addEventListener("input", () => applyFaqFilters());
}

function applyFaqFilters() {
  const query = document.getElementById("faqSearchInput").value.trim().toLowerCase();

  const filtered = FAQ_DATA.filter((item) => {
    const matchesCategory = activeFaqCategory === "all" || item.category === activeFaqCategory;
    const matchesQuery =
      !query || item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  renderFaqList(filtered);
}

function renderFaqList(items) {
  const container = document.getElementById("faqList");

  if (!items.length) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-circle-question"></i>
        <h3>No answers found</h3>
        <p>Try a different search term, or contact our support team directly.</p>
        <a href="contact.html" class="btn btn-primary">Contact Support</a>
      </div>`;
    return;
  }

  container.innerHTML = items
    .map(
      (item, index) => `
      <div class="faq-item">
        <h3>
          <button type="button" class="faq-question" id="faqQuestion-${index}" aria-expanded="false" aria-controls="faqAnswer-${index}">
            <span class="faq-category-tag">${item.category}</span>
            ${item.question}
            <i class="fa-solid fa-chevron-down faq-chevron"></i>
          </button>
        </h3>
        <div class="faq-answer" id="faqAnswer-${index}" role="region" aria-labelledby="faqQuestion-${index}" hidden>
          <p>${item.answer}</p>
        </div>
      </div>`
    )
    .join("");

  container.querySelectorAll(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => toggleFaqItem(btn));
  });
}

function toggleFaqItem(btn) {
  const answer = document.getElementById(btn.getAttribute("aria-controls"));
  const isOpen = btn.getAttribute("aria-expanded") === "true";

  btn.setAttribute("aria-expanded", String(!isOpen));
  answer.hidden = isOpen;
  btn.closest(".faq-item").classList.toggle("open", !isOpen);
}
